import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  slug: string
  basePath: string
  paginaAtual: number
  totalPaginas: number
  searchParams?: Record<string, string>
}

export function PaginacaoSite({
  slug,
  basePath,
  paginaAtual,
  totalPaginas,
  searchParams = {},
}: Props) {
  if (totalPaginas <= 1) return null

  function criarUrl(pagina: number) {
    const params = new URLSearchParams(searchParams)
    params.set("pagina", String(pagina))
    return `/${slug}/${basePath}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {paginaAtual > 1 ? (
        <Link
          href={criarUrl(paginaAtual - 1)}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </span>
      )}

      <span className="px-3 text-sm text-muted-foreground">
        Página {paginaAtual} de {totalPaginas}
      </span>

      {paginaAtual < totalPaginas ? (
        <Link
          href={criarUrl(paginaAtual + 1)}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50">
          Próxima
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  )
}
