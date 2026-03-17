"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface PaginacaoBaseProps {
  pagina: number
  totalPaginas: number
  porPagina?: number
}

interface PaginacaoClientProps extends PaginacaoBaseProps {
  onMudarPagina: (novaPagina: number) => void
  baseUrl?: never
  paramsBase?: never
}

interface PaginacaoServerProps extends PaginacaoBaseProps {
  baseUrl: string
  paramsBase?: Record<string, string>
  onMudarPagina?: never
}

type PaginacaoListagemProps = PaginacaoClientProps | PaginacaoServerProps

const OPCOES_POR_PAGINA = ["12", "24", "48"]

export function PaginacaoListagem({
  pagina,
  totalPaginas,
  onMudarPagina,
  baseUrl,
  paramsBase,
  porPagina,
}: PaginacaoListagemProps) {
  if (totalPaginas <= 1 && !porPagina) return null

  function montarUrl(p: number) {
    return `${baseUrl}?${new URLSearchParams({ ...paramsBase, pagina: String(p) })}`
  }

  function montarUrlPorPagina(n: number) {
    return `${baseUrl}?${new URLSearchParams({ ...paramsBase, pagina: "1", porPagina: String(n) })}`
  }

  function renderBotao(
    targetPagina: number,
    icon: React.ReactNode,
    label: string,
    disabled: boolean
  ) {
    if (baseUrl) {
      return (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          render={!disabled ? <Link href={montarUrl(targetPagina)} /> : undefined}
          aria-label={label}
        >
          {icon}
        </Button>
      )
    }
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
        onClick={() => !disabled && onMudarPagina?.(targetPagina)}
        aria-label={label}
      >
        {icon}
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-muted-foreground">
      {/* Linhas por página — só no modo servidor */}
      {porPagina && baseUrl && (
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">Linhas por página</span>
          <Select
            value={String(porPagina)}
            onValueChange={(valor) => {
              window.location.href = montarUrlPorPagina(Number(valor))
            }}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPCOES_POR_PAGINA.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Info de página + botões de navegação */}
      <span className="whitespace-nowrap">
        Página {pagina} de {totalPaginas}
      </span>

      <div className="flex items-center gap-1">
        {renderBotao(1, <ChevronFirst className="h-4 w-4" />, "Primeira página", pagina <= 1)}
        {renderBotao(pagina - 1, <ChevronLeft className="h-4 w-4" />, "Página anterior", pagina <= 1)}
        {renderBotao(pagina + 1, <ChevronRight className="h-4 w-4" />, "Próxima página", pagina >= totalPaginas)}
        {renderBotao(totalPaginas, <ChevronLast className="h-4 w-4" />, "Última página", pagina >= totalPaginas)}
      </div>
    </div>
  )
}
