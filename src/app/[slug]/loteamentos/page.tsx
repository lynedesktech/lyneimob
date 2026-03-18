import { notFound } from "next/navigation"
import { Suspense } from "react"
import {
  buscarOrganizacaoPorSlug,
  buscarLoteamentosPublicos,
} from "@/lib/site/buscar-dados-site"
import { CardLoteamentoPublico } from "@/components/site/card-loteamento-publico"
import { FiltrosLoteamentosPublico } from "@/components/site/filtros-loteamentos-publico"
import { PaginacaoSite } from "@/components/site/paginacao-site"
import { LandPlot } from "lucide-react"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { AnimacaoScroll } from "@/components/site/animacao-scroll"
import type { Metadata } from "next"

type Params = Promise<{ slug: string }>
type SearchParams = Promise<Record<string, string | undefined>>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const org = await buscarOrganizacaoPorSlug(slug)

  if (!org) return {}

  return {
    title: "Loteamentos disponíveis",
    description: `Conheça os loteamentos disponíveis na ${org.nome}. Terrenos e lotes prontos para construir.`,
  }
}

export default async function ListagemLoteamentosPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { slug } = await params
  const filtros = await searchParams

  const organizacao = await buscarOrganizacaoPorSlug(slug)
  if (!organizacao) {
    notFound()
  }

  const { loteamentos, total, totalPaginas, paginaAtual } =
    await buscarLoteamentosPublicos(organizacao.id, {
      status: filtros.status,
      cidade: filtros.cidade,
      busca: filtros.busca,
      pagina: filtros.pagina ? Number(filtros.pagina) : 1,
    })

  // Extrair filtros atuais para a paginação (sem a página)
  const filtrosAtuais: Record<string, string> = {}
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor && chave !== "pagina") {
      filtrosAtuais[chave] = valor
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Loteamentos disponíveis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total}{" "}
          {total === 1 ? "loteamento encontrado" : "loteamentos encontrados"}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8">
        <Suspense>
          <FiltrosLoteamentosPublico slug={slug} />
        </Suspense>
      </div>

      {/* Grid de loteamentos */}
      {loteamentos.length > 0 ? (
        <>
          <AnimacaoScroll>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loteamentos.map((loteamento) => (
                <CardLoteamentoPublico
                  key={loteamento.id}
                  loteamento={loteamento}
                  slug={slug}
                />
              ))}
            </div>
          </AnimacaoScroll>

          {/* Paginação */}
          <div className="mt-10">
            <PaginacaoSite
              slug={slug}
              basePath="loteamentos"
              paginaAtual={paginaAtual}
              totalPaginas={totalPaginas}
              searchParams={filtrosAtuais}
            />
          </div>
        </>
      ) : (
        <EstadoVazio
          icone={LandPlot}
          titulo="Nenhum loteamento encontrado"
          descricao="Tente ajustar os filtros ou volte mais tarde."
          className="py-16"
        />
      )}
    </div>
  )
}
