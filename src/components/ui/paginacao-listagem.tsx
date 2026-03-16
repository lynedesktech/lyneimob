import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PaginacaoBaseProps {
  pagina: number
  totalPaginas: number
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

export function PaginacaoListagem({
  pagina,
  totalPaginas,
  onMudarPagina,
  construtorHref,
}: PaginacaoListagemProps) {
  if (totalPaginas <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2">
      {construtorHref ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pagina <= 1}
          render={pagina > 1 ? <Link href={construtorHref(pagina - 1)} /> : undefined}
        >
          Anterior
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={pagina <= 1}
          onClick={() => onMudarPagina?.(pagina - 1)}
        >
          Anterior
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        Página {pagina} de {totalPaginas}
      </span>
      {construtorHref ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pagina >= totalPaginas}
          render={pagina < totalPaginas ? <Link href={construtorHref(pagina + 1)} /> : undefined}
        >
          Próxima
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={pagina >= totalPaginas}
          onClick={() => onMudarPagina?.(pagina + 1)}
        >
          Próxima
        </Button>
      )}
    </div>
  )
}
