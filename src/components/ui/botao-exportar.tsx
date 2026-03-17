"use client"

import { useState, useCallback } from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { gerarExcel } from "@/lib/exportacao/gerar-excel"
import { gerarPdf } from "@/lib/exportacao/gerar-pdf"
import { colunasPorModulo } from "@/lib/exportacao/colunas"
import {
  buscarImoveisParaExportacao,
  buscarClientesParaExportacao,
  buscarNegociosParaExportacao,
  buscarAtividadesParaExportacao,
} from "@/actions/exportacao"
import type {
  ModuloExportacao,
  FormatoExportacao,
  FiltrosExportacaoImoveis,
  FiltrosExportacaoClientes,
  FiltrosExportacaoNegocios,
  FiltrosExportacaoAtividades,
} from "@/types/exportacao"

type FiltrosExportacao =
  | FiltrosExportacaoImoveis
  | FiltrosExportacaoClientes
  | FiltrosExportacaoNegocios
  | FiltrosExportacaoAtividades

type Props = {
  modulo: ModuloExportacao
  filtros: FiltrosExportacao
  total: number
}

const titulosModulo: Record<ModuloExportacao, string> = {
  imoveis: "Imóveis",
  clientes: "Clientes",
  negocios: "Negócios",
  atividades: "Atividades",
}

const buscadores: Record<
  ModuloExportacao,
  (filtros: FiltrosExportacao) => Promise<{ erro?: string; dados?: Record<string, unknown>[] }>
> = {
  imoveis: (f) => buscarImoveisParaExportacao(f as FiltrosExportacaoImoveis),
  clientes: (f) => buscarClientesParaExportacao(f as FiltrosExportacaoClientes),
  negocios: (f) => buscarNegociosParaExportacao(f as FiltrosExportacaoNegocios),
  atividades: (f) => buscarAtividadesParaExportacao(f as FiltrosExportacaoAtividades),
}

export function BotaoExportar({ modulo, filtros, total }: Props) {
  const [exportando, setExportando] = useState(false)

  const exportar = useCallback(
    async (formato: FormatoExportacao) => {
      setExportando(true)

      try {
        const buscar = buscadores[modulo]
        const { erro, dados } = await buscar(filtros)

        if (erro || !dados) {
          toast.error(erro ?? "Erro ao buscar dados para exportação.")
          return
        }

        if (dados.length === 0) {
          toast.error("Nenhum dado encontrado para exportar.")
          return
        }

        const colunas = colunasPorModulo[modulo]
        const titulo = titulosModulo[modulo]
        const timestamp = new Date().toISOString().slice(0, 10)
        const nomeArquivo = `${modulo}-${timestamp}`

        // Montar subtítulo com filtros ativos
        const filtrosAtivos = Object.entries(filtros)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${k}: ${v}`)
          .join(" | ")
        const subtitulo = filtrosAtivos
          ? `Filtros: ${filtrosAtivos}`
          : "Exportação completa (sem filtros)"

        if (formato === "excel") {
          gerarExcel(dados, colunas, nomeArquivo)
          toast.success(`${dados.length} ${titulo.toLowerCase()} exportados para Excel.`)
        } else {
          gerarPdf(dados, colunas, { titulo, subtitulo }, nomeArquivo)
          toast.success(`${dados.length} ${titulo.toLowerCase()} exportados para PDF.`)
        }
      } catch {
        toast.error("Erro ao gerar o arquivo de exportação.")
      } finally {
        setExportando(false)
      }
    },
    [modulo, filtros]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" disabled={total === 0 || exportando} />}
      >
        {exportando ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {exportando ? "Exportando..." : "Exportar"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => exportar("excel")}>
          <FileSpreadsheet className="h-4 w-4 text-success" />
          Planilha Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportar("pdf")}>
          <FileText className="h-4 w-4 text-destructive" />
          Relatório PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
