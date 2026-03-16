import * as XLSX from "xlsx"
import type { ColunaExportacao } from "@/types/exportacao"

/**
 * Gera e dispara download de um arquivo Excel (.xlsx)
 * com os dados fornecidos e colunas configuradas.
 */
export function gerarExcel(
  dados: Record<string, unknown>[],
  colunas: ColunaExportacao[],
  nomeArquivo: string
) {
  // Montar cabeçalhos
  const cabecalhos = colunas.map((c) => c.label)

  // Montar linhas
  const linhas = dados.map((item) =>
    colunas.map((col) => {
      const valor = item[col.campo]
      if (col.formatar) return col.formatar(valor)
      if (valor === null || valor === undefined) return ""
      return String(valor)
    })
  )

  // Criar sheet
  const sheet = XLSX.utils.aoa_to_sheet([cabecalhos, ...linhas])

  // Largura automática das colunas
  sheet["!cols"] = colunas.map((col, i) => {
    const maxLargura = Math.max(
      col.label.length,
      ...linhas.map((linha) => String(linha[i] ?? "").length)
    )
    return { wch: Math.min(Math.max(maxLargura + 2, 10), 50) }
  })

  // Criar workbook e disparar download
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "Dados")
  XLSX.writeFile(workbook, `${nomeArquivo}.xlsx`)
}
