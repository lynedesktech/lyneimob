import { notFound } from "next/navigation"
import { Suspense } from "react"
import {
  buscarOrganizacaoPorSlug,
  buscarImoveisPublicos,
} from "@/lib/site/buscar-dados-site"
import { CardImovelPublico } from "@/components/site/card-imovel-publico"
import { FiltrosImoveisPublico } from "@/components/site/filtros-imoveis-publico"
import { PaginacaoSite } from "@/components/site/paginacao-site"
import { Building2 } from "lucide-react"
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
    title: "Imóveis disponíveis",
    description: `Veja todos os imóveis disponíveis na ${org.nome}. Casas, apartamentos, terrenos e muito mais.`,
  }
}

export default async function ListagemImoveisPage({
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

  const { imoveis, total, totalPaginas, paginaAtual } =
    await buscarImoveisPublicos(organizacao.id, {
      tipo: filtros.tipo,
      finalidade: filtros.finalidade,
      cidade: filtros.cidade,
      busca: filtros.busca,
      preco_min: filtros.preco_min ? Number(filtros.preco_min) : undefined,
      preco_max: filtros.preco_max ? Number(filtros.preco_max) : undefined,
      quartos: filtros.quartos ? Number(filtros.quartos) : undefined,
      vagas: filtros.vagas ? Number(filtros.vagas) : undefined,
      area_min: filtros.area_min ? Number(filtros.area_min) : undefined,
      area_max: filtros.area_max ? Number(filtros.area_max) : undefined,
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
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold sm:text-2xl">Imóveis disponíveis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8">
        <Suspense>
          <FiltrosImoveisPublico slug={slug} />
        </Suspense>
      </div>

      {/* Grid de imóveis */}
      {imoveis.length > 0 ? (
        <>
          <AnimacaoScroll>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {imoveis.map((imovel) => (
                <CardImovelPublico
                  key={imovel.id}
                  imovel={imovel}
                  slug={slug}
                />
              ))}
            </div>
          </AnimacaoScroll>

          {/* Paginação */}
          <div className="mt-10">
            <PaginacaoSite
              slug={slug}
              basePath="imoveis"
              paginaAtual={paginaAtual}
              totalPaginas={totalPaginas}
              searchParams={filtrosAtuais}
            />
          </div>
        </>
      ) : (
        <EstadoVazio
          icone={Building2}
          titulo="Nenhum imóvel encontrado"
          descricao="Tente ajustar os filtros ou volte mais tarde."
          className="py-16"
        />
      )}
    </div>
  )
}
