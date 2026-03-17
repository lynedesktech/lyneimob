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
  construtorHrefPorPagina?: (porPagina: number) => string
}

interface PaginacaoClientProps extends PaginacaoBaseProps {
  onMudarPagina: (novaPagina: number) => void
  construtorHref?: never
}

interface PaginacaoServerProps extends PaginacaoBaseProps {
  construtorHref: (pagina: number) => string
  onMudarPagina?: never
}

type PaginacaoListagemProps = PaginacaoClientProps | PaginacaoServerProps

const OPCOES_POR_PAGINA = ["12", "24", "48"]

export function PaginacaoListagem({
  pagina,
  totalPaginas,
  onMudarPagina,
  construtorHref,
  porPagina,
  construtorHrefPorPagina,
}: PaginacaoListagemProps) {
  if (totalPaginas <= 1 && !porPagina) return null

  function renderBotao(
    targetPagina: number,
    icon: React.ReactNode,
    label: string,
    disabled: boolean
  ) {
    if (construtorHref) {
      return (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          render={!disabled ? <Link href={construtorHref(targetPagina)} /> : undefined}
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
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
      {/* Rows per page */}
      {porPagina && construtorHrefPorPagina && (
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">Linhas por página</span>
          <Select
            value={String(porPagina)}
            onValueChange={(valor) => {
              window.location.href = construtorHrefPorPagina(Number(valor))
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

      {/* Page info */}
      {totalPaginas > 1 && (
        <>
          <span className="whitespace-nowrap">
            Página {pagina} de {totalPaginas}
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            {renderBotao(1, <ChevronFirst className="h-4 w-4" />, "Primeira página", pagina <= 1)}
            {renderBotao(pagina - 1, <ChevronLeft className="h-4 w-4" />, "Página anterior", pagina <= 1)}
            {renderBotao(pagina + 1, <ChevronRight className="h-4 w-4" />, "Próxima página", pagina >= totalPaginas)}
            {renderBotao(totalPaginas, <ChevronLast className="h-4 w-4" />, "Última página", pagina >= totalPaginas)}
          </div>
        </>
      )}
    </div>
  )
}
