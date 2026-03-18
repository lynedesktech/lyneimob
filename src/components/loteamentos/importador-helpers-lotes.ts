import Papa from "papaparse"
import * as XLSX from "xlsx"
import {
  schemaLinhaImportacaoLote,
  MAPEAMENTO_COLUNAS_LOTES,
  COLUNAS_TEMPLATE_LOTES,
} from "@/types/importacao-lotes"
import type { LinhaImportacaoLote } from "@/types/importacao-lotes"

// ============================================================
// Helpers do importador de lotes
// Funções puras de parsing, mapeamento manual e validação
// ============================================================

// ---- Tipos ----

export type ResultadoValidacaoLote = {
  linha: number
  dados: Record<string, string>
  valido: boolean
  erros: string[]
  dadosValidados?: LinhaImportacaoLote
}

/** Dados brutos extraídos do arquivo (antes do mapeamento) */
export type DadosBrutos = {
  cabecalhos: string[]
  linhas: string[][]
}

/** Mapeamento: campo do sistema → índice da coluna no arquivo */
export type Mapeamento = Record<string, number | null>

// ---- Campos do sistema ----

export const CAMPOS_SISTEMA = [
  { campo: "quadra", label: "Quadra", obrigatorio: true },
  { campo: "numero_lote", label: "Número do Lote", obrigatorio: true },
  { campo: "unidade", label: "Unidade", obrigatorio: false },
  { campo: "valor", label: "Valor", obrigatorio: true },
  { campo: "area", label: "Área (m²)", obrigatorio: false },
  { campo: "comprador", label: "Comprador", obrigatorio: false },
  { campo: "data_venda", label: "Data Venda", obrigatorio: false },
] as const

// ---- Parsing bruto ----

/** Lê CSV ou Excel e retorna cabecalhos + linhas brutas (sem mapear campos) */
export function parsearArquivoBruto(file: File): Promise<DadosBrutos> {
  return new Promise((resolve, reject) => {
    const extensao = file.name.split(".").pop()?.toLowerCase()

    if (extensao === "csv") {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete(results) {
          const raw = results.data as string[][]
          if (raw.length < 2) {
            reject(new Error("O arquivo precisa ter pelo menos 1 cabeçalho e 1 linha de dados"))
            return
          }
          const cabecalhos = raw[0].map((h) => String(h).trim())
          const linhas = raw.slice(1).filter((row) => row.some((cell) => cell !== ""))
          resolve({ cabecalhos, linhas })
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

          const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
          })

          if (rawData.length < 2) {
            reject(new Error("A planilha precisa ter pelo menos 1 cabeçalho e 1 linha de dados"))
            return
          }

          const cabecalhos = rawData[0].map((h) => String(h).trim())
          const linhas = rawData
            .slice(1)
            .filter((row) => row.some((cell) => cell !== ""))
            .map((row) => row.map((cell) => String(cell)))

          resolve({ cabecalhos, linhas })
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

// ---- Sugestão automática de mapeamento ----

/** Tenta sugerir mapeamento automático usando MAPEAMENTO_COLUNAS_LOTES */
export function sugerirMapeamento(cabecalhos: string[]): Mapeamento {
  const mapeamento: Mapeamento = {}

  // Inicializar todos os campos como não mapeados
  for (const { campo } of CAMPOS_SISTEMA) {
    mapeamento[campo] = null
  }

  // Tentar match para cada cabeçalho
  for (let i = 0; i < cabecalhos.length; i++) {
    const header = cabecalhos[i]
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")

    // Match direto
    const campoSistema = MAPEAMENTO_COLUNAS_LOTES[header]
    if (campoSistema && mapeamento[campoSistema] === null) {
      mapeamento[campoSistema] = i
      continue
    }

    // Match com acento (original lowercase)
    const headerOriginal = cabecalhos[i].toLowerCase().trim().replace(/\s+/g, "_")
    const campoOriginal = MAPEAMENTO_COLUNAS_LOTES[headerOriginal]
    if (campoOriginal && mapeamento[campoOriginal] === null) {
      mapeamento[campoOriginal] = i
    }
  }

  return mapeamento
}

// ---- Aplicar mapeamento ----

/** Aplica o mapeamento definido pelo usuário e retorna dados prontos para validação */
export function aplicarMapeamento(
  linhas: string[][],
  mapeamento: Mapeamento
): Record<string, string>[] {
  return linhas.map((linha) => {
    const registro: Record<string, string> = {}

    for (const [campo, indice] of Object.entries(mapeamento)) {
      if (indice !== null && indice < linha.length) {
        const valor = String(linha[indice]).trim()
        if (valor !== "") {
          registro[campo] = valor
        }
      }
    }

    return registro
  })
}

// ---- Validação ----

/** Valida dados mapeados contra o schema Zod */
export function validarLinhasLotes(dados: Record<string, string>[]): ResultadoValidacaoLote[] {
  return dados.map((row, i) => {
    const dadosLimpos: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(row)) {
      dadosLimpos[key] = val === "" ? undefined : val
    }

    const resultado = schemaLinhaImportacaoLote.safeParse(dadosLimpos)

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

// ---- Template ----

/** Gera e baixa o modelo de planilha Excel para lotes */
export function baixarModeloLotes() {
  const cabecalhos: Record<string, string> = {
    quadra: "Quadra *",
    numero_lote: "Número do Lote *",
    unidade: "Unidade",
    valor: "Valor *",
    area: "Área (m²)",
    comprador: "Comprador",
    data_venda: "Data Venda (DD/MM/AAAA)",
  }

  const exemplo: Record<string, string | number> = {
    quadra: "A",
    numero_lote: "01",
    unidade: "A-01",
    valor: 150000,
    area: 200,
    comprador: "",
    data_venda: "",
  }

  const headerRow = COLUNAS_TEMPLATE_LOTES.map((col) => cabecalhos[col] || col)
  const dataRow = COLUNAS_TEMPLATE_LOTES.map((col) => exemplo[col] ?? "")

  const ws = XLSX.utils.aoa_to_sheet([headerRow, dataRow])

  ws["!cols"] = COLUNAS_TEMPLATE_LOTES.map((col) => ({
    wch: Math.max(18, (cabecalhos[col] || col).length + 2),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Lotes")
  XLSX.writeFile(wb, "modelo-importacao-lotes.xlsx")
}
