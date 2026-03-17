import Papa from "papaparse"
import * as XLSX from "xlsx"
import {
  schemaLinhaImportacao,
  MAPEAMENTO_COLUNAS,
  COLUNAS_TEMPLATE,
} from "@/types/importacao"
import type { ResultadoValidacao } from "@/types/importacao"

// ============================================================
// Helpers do importador de imóveis
// Funções puras de parsing, validação e geração de template
// ============================================================

/** Gera e baixa o modelo de planilha Excel */
export function baixarModelo() {
  const cabecalhos: Record<string, string> = {
    codigo: "Código *",
    titulo: "Título *",
    tipo: "Tipo * (apartamento, casa, terreno, sala_comercial, galpao, cobertura, kitnet, fazenda, sitio, loja, outro)",
    finalidade: "Finalidade * (venda, aluguel, venda_e_aluguel)",
    cidade: "Cidade *",
    estado: "Estado * (UF, ex: SP)",
    bairro: "Bairro",
    logradouro: "Logradouro",
    numero: "Número",
    complemento: "Complemento",
    cep: "CEP",
    preco_venda: "Preço Venda",
    preco_aluguel: "Preço Aluguel",
    iptu: "IPTU",
    condominio: "Condomínio",
    area_total: "Área Total (m²)",
    area_construida: "Área Construída (m²)",
    quartos: "Quartos",
    suites: "Suítes",
    banheiros: "Banheiros",
    vagas_garagem: "Vagas Garagem",
    andares: "Andares",
    descricao: "Descrição",
    observacoes_internas: "Observações Internas",
  }

  const exemplo: Record<string, string | number> = {
    codigo: "APT-001",
    titulo: "Apartamento Centro",
    tipo: "apartamento",
    finalidade: "venda",
    cidade: "São Paulo",
    estado: "SP",
    bairro: "Centro",
    logradouro: "Rua Augusta",
    numero: "100",
    complemento: "Apto 42",
    cep: "01310-100",
    preco_venda: 450000,
    preco_aluguel: "",
    iptu: 1200,
    condominio: 800,
    area_total: 85,
    area_construida: 72,
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas_garagem: 1,
    andares: "",
    descricao: "Apartamento reformado no centro",
    observacoes_internas: "",
  }

  // Montar dados com cabeçalhos amigáveis
  const headerRow = COLUNAS_TEMPLATE.map((col) => cabecalhos[col] || col)
  const dataRow = COLUNAS_TEMPLATE.map((col) => exemplo[col] ?? "")

  const ws = XLSX.utils.aoa_to_sheet([headerRow, dataRow])

  // Largura das colunas
  ws["!cols"] = COLUNAS_TEMPLATE.map((col) => ({
    wch: Math.max(20, (cabecalhos[col] || col).length + 2),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Imóveis")
  XLSX.writeFile(wb, "modelo-importacao-imoveis.xlsx")
}

/** Mapeia cabeçalhos do arquivo para campos do sistema */
export function mapearCabecalhos(cabecalhos: string[]): Record<number, string> {
  const mapa: Record<number, string> = {}

  for (let i = 0; i < cabecalhos.length; i++) {
    const header = cabecalhos[i]
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")

    // Tentar match direto
    if (MAPEAMENTO_COLUNAS[header]) {
      mapa[i] = MAPEAMENTO_COLUNAS[header]
      continue
    }

    // Tentar com acento (o original lowercase)
    const headerOriginal = cabecalhos[i].toLowerCase().trim().replace(/\s+/g, "_")
    if (MAPEAMENTO_COLUNAS[headerOriginal]) {
      mapa[i] = MAPEAMENTO_COLUNAS[headerOriginal]
      continue
    }

    // Tentar match parcial: se contém "preco" e "venda"
    if (header.includes("preco") && header.includes("venda")) {
      mapa[i] = "preco_venda"
    } else if (header.includes("preco") && header.includes("aluguel")) {
      mapa[i] = "preco_aluguel"
    } else if (header.includes("area") && header.includes("total")) {
      mapa[i] = "area_total"
    } else if (header.includes("area") && header.includes("construi")) {
      mapa[i] = "area_construida"
    }
  }

  return mapa
}

/** Parseia arquivo e retorna array de objetos mapeados */
export function parsearArquivo(
  file: File
): Promise<{ dados: Record<string, string>[]; cabecalhosMapeados: string[] }> {
  return new Promise((resolve, reject) => {
    const extensao = file.name.split(".").pop()?.toLowerCase()

    if (extensao === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete(results) {
          const cabecalhosOriginais = results.meta.fields || []
          const mapa = mapearCabecalhos(cabecalhosOriginais)

          const dados = (results.data as Record<string, string>[]).map((row) => {
            const mapped: Record<string, string> = {}
            cabecalhosOriginais.forEach((header, idx) => {
              const campo = mapa[idx]
              if (campo && row[header] != null && row[header] !== "") {
                mapped[campo] = String(row[header]).trim()
              }
            })
            return mapped
          })

          const cabecalhosMapeados = Object.values(mapa)
          resolve({ dados, cabecalhosMapeados })
        },
        error(err) {
          reject(new Error(`Erro ao ler CSV: ${err.message}`))
        },
      })
    } else if (extensao === "xlsx" || extensao === "xls") {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]

          // Converter para array de arrays
          const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
          })

          if (rawData.length < 2) {
            reject(new Error("A planilha precisa ter pelo menos 1 cabeçalho e 1 linha de dados"))
            return
          }

          // Limpar cabeçalhos (remover instruções entre parênteses)
          const cabecalhosOriginais = rawData[0].map((h) =>
            String(h).replace(/\s*\(.*?\)\s*/g, "").trim()
          )
          const mapa = mapearCabecalhos(cabecalhosOriginais)

          const dados = rawData.slice(1)
            .filter((row) => row.some((cell) => cell !== ""))
            .map((row) => {
              const mapped: Record<string, string> = {}
              cabecalhosOriginais.forEach((_, idx) => {
                const campo = mapa[idx]
                if (campo && row[idx] != null && row[idx] !== "") {
                  mapped[campo] = String(row[idx]).trim()
                }
              })
              return mapped
            })

          const cabecalhosMapeados = Object.values(mapa)
          resolve({ dados, cabecalhosMapeados })
        } catch {
          reject(new Error("Erro ao ler arquivo Excel. Verifique o formato."))
        }
      }
      reader.onerror = () => reject(new Error("Erro ao ler o arquivo"))
      reader.readAsArrayBuffer(file)
    } else {
      reject(new Error("Formato não suportado. Use .csv, .xlsx ou .xls"))
    }
  })
}

/** Valida dados mapeados contra o schema Zod */
export function validarLinhas(dados: Record<string, string>[]): ResultadoValidacao[] {
  return dados.map((row, i) => {
    // Preparar dados: converter strings vazias em undefined para campos opcionais
    const dadosLimpos: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(row)) {
      dadosLimpos[key] = val === "" ? undefined : val
    }

    const resultado = schemaLinhaImportacao.safeParse(dadosLimpos)

    if (resultado.success) {
      return {
        linha: i + 1,
        dados: row,
        valido: true,
        erros: [],
        dadosValidados: resultado.data,
      }
    }

    return {
      linha: i + 1,
      dados: row,
      valido: false,
      erros: resultado.error.issues.map((issue) => {
        const campo = issue.path.join(".")
        return `${campo}: ${issue.message}`
      }),
    }
  })
}
