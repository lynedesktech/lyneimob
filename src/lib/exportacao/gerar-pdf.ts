import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"
import type { ColunaExportacao, ConfigPdf } from "@/types/exportacao"

/**
 * Gera e dispara download de um relatório PDF (.pdf)
 * com cabeçalho, tabela formatada e paginação.
 */
export function gerarPdf(
  dados: Record<string, unknown>[],
  colunas: ColunaExportacao[],
  config: ConfigPdf,
  nomeArquivo: string
) {
  const doc = new jsPDF({
    orientation: config.orientacao ?? "landscape",
    unit: "mm",
    format: "a4",
  })

  const larguraPagina = doc.internal.pageSize.getWidth()

  // Cabeçalho
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(6, 58, 140) // #063A8C
  doc.text(config.titulo, 14, 18)

  // Subtítulo (filtros aplicados)
  let startY = 24
  if (config.subtitulo) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.text(config.subtitulo, 14, startY)
    startY += 5
  }

  // Data de geração
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  const dataGeracao = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())
  doc.text(`Gerado em ${dataGeracao}`, 14, startY)
  startY += 6

  // Montar dados da tabela
  const head = [colunas.map((c) => c.label)]
  const body = dados.map((item) =>
    colunas.map((col) => {
      const valor = item[col.campo]
      if (col.formatar) return col.formatar(valor)
      if (valor === null || valor === undefined) return ""
      return String(valor)
    })
  )

  // Gerar tabela
  autoTable(doc, {
    head,
    body,
    startY,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [6, 58, 140], // #063A8C
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didDrawPage: (data) => {
      // Rodapé com paginação
      const alturaPagina = doc.internal.pageSize.getHeight()
      const paginaAtual = doc.getCurrentPageInfo().pageNumber
      const totalPaginas = doc.getNumberOfPages()

      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Página ${paginaAtual} de ${totalPaginas}`,
        larguraPagina - 14,
        alturaPagina - 10,
        { align: "right" }
      )
      doc.text("LyneImob", 14, alturaPagina - 10)
    },
  })

  // Corrigir total de páginas (didDrawPage roda antes de saber o total)
  const totalPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    const alturaPagina = doc.internal.pageSize.getHeight()
    // Limpar área do rodapé e redesenhar com total correto
    doc.setFillColor(255, 255, 255)
    doc.rect(larguraPagina - 60, alturaPagina - 14, 50, 8, "F")
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      larguraPagina - 14,
      alturaPagina - 10,
      { align: "right" }
    )
  }

  doc.save(`${nomeArquivo}.pdf`)
}
