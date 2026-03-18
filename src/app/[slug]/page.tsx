import { notFound } from "next/navigation"
import Link from "next/link"
import {
  buscarOrganizacaoPorSlug,
  buscarImoveisDestaque,
  buscarEstatisticasSite,
  buscarLoteamentosDestaque,
} from "@/lib/site/buscar-dados-site"
import { extrairConfiguracoes } from "@/types/configuracoes-site"
import { SecaoHero } from "@/components/site/secao-hero"
import { SecaoBuscarPorTipo } from "@/components/site/secao-buscar-por-tipo"
import { CardImovelPublico } from "@/components/site/card-imovel-publico"
import { CardLoteamentoPublico } from "@/components/site/card-loteamento-publico"
import { SecaoEstatisticas } from "@/components/site/secao-estatisticas"
import { SecaoCta } from "@/components/site/secao-cta"
import { Building2, ArrowRight, Phone, Mail, MapPin, BookOpen } from "lucide-react"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { AnimacaoScroll } from "@/components/site/animacao-scroll"

type Params = Promise<{ slug: string }>

export default async function HomePage({
  params,
}: {
  params: Params
}) {
  const { slug } = await params
  const organizacao = await buscarOrganizacaoPorSlug(slug)

  if (!organizacao) {
    notFound()
  }

  const [imoveis, estatisticas, loteamentosDestaque] = await Promise.all([
    buscarImoveisDestaque(organizacao.id),
    buscarEstatisticasSite(organizacao.id),
    buscarLoteamentosDestaque(organizacao.id),
  ])

  const configs = extrairConfiguracoes(
    organizacao.configuracoes_site as Record<string, unknown>
  )

  const endereco = organizacao.endereco as {
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    estado?: string
  } | null

  return (
    <>
      {/* 1. Hero + Busca rápida */}
      <SecaoHero organizacao={organizacao} />

      {/* 2. Buscar por tipo de imóvel */}
      <AnimacaoScroll>
        <SecaoBuscarPorTipo slug={slug} />
      </AnimacaoScroll>

      {/* 3. Imóveis em destaque */}
      <AnimacaoScroll>
        <section className="border-t bg-muted/30 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Imóveis em destaque
              </h2>
              <Link
                href={`/${slug}/imoveis`}
                className="flex items-center gap-1 text-sm font-medium text-[var(--site-primaria)] hover:underline"
              >
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {imoveis.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {imoveis.map((imovel) => (
                  <CardImovelPublico
                    key={imovel.id}
                    imovel={imovel}
                    slug={slug}
                  />
                ))}
              </div>
            ) : (
              <EstadoVazio
                icone={Building2}
                titulo="Nenhum imóvel disponível no momento"
                className="py-16"
              />
            )}
          </div>
        </section>
      </AnimacaoScroll>

      {/* 4. Loteamentos em destaque */}
      {loteamentosDestaque.length > 0 && (
        <AnimacaoScroll>
          <section className="px-4 py-16">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  Loteamentos em destaque
                </h2>
                <Link
                  href={`/${slug}/loteamentos`}
                  className="flex items-center gap-1 text-sm font-medium text-[var(--site-primaria)] hover:underline"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {loteamentosDestaque.map((loteamento) => (
                  <CardLoteamentoPublico
                    key={loteamento.id}
                    loteamento={loteamento}
                    slug={slug}
                  />
                ))}
              </div>
            </div>
          </section>
        </AnimacaoScroll>
      )}

      {/* 5. Estatísticas */}
      <AnimacaoScroll>
        <SecaoEstatisticas
          totalImoveis={estatisticas.totalImoveis}
          totalBairros={estatisticas.totalBairros}
          totalLoteamentos={estatisticas.totalLoteamentos}
        />
      </AnimacaoScroll>

      {/* 5. Sobre a empresa */}
      <AnimacaoScroll>
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-5">
            {/* Texto sobre a empresa (3/5) */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-foreground">
                Sobre a {organizacao.nome}
              </h2>

              {configs.sobre.historia ? (
                <p className="mt-4 whitespace-pre-line text-muted-foreground leading-relaxed">
                  {configs.sobre.historia}
                </p>
              ) : (
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  A {organizacao.nome} é uma imobiliária comprometida em
                  encontrar o imóvel ideal para cada cliente. Com atendimento
                  personalizado e amplo portfólio de imóveis, estamos prontos
                  para ajudar você a realizar seu sonho.
                </p>
              )}

              {configs.sobre.missao && (
                <div className="mt-6 rounded-lg border bg-muted/30 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--site-primaria)]" />
                    <span className="text-sm font-semibold">Nossa Missão</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{configs.sobre.missao}</p>
                </div>
              )}

              <Link
                href={`/${slug}/sobre`}
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--site-primaria)] hover:underline"
              >
                Conheça mais sobre nós
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Dados de contato (2/5) */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {organizacao.telefone && (
                  <a
                    href={`tel:${organizacao.telefone}`}
                    className="flex items-start gap-3 rounded-lg border bg-background p-5 transition-colors hover:border-[var(--site-primaria)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--site-primaria)]/10">
                      <Phone className="h-4 w-4 text-[var(--site-primaria)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">
                        {organizacao.telefone}
                      </p>
                    </div>
                  </a>
                )}
                {organizacao.email && (
                  <a
                    href={`mailto:${organizacao.email}`}
                    className="flex items-start gap-3 rounded-lg border bg-background p-5 transition-colors hover:border-[var(--site-primaria)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--site-primaria)]/10">
                      <Mail className="h-4 w-4 text-[var(--site-primaria)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {organizacao.email}
                      </p>
                    </div>
                  </a>
                )}
                {endereco?.cidade && (
                  <div className="flex items-start gap-3 rounded-lg border bg-background p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--site-primaria)]/10">
                      <MapPin className="h-4 w-4 text-[var(--site-primaria)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Localização</p>
                      <p className="text-sm text-muted-foreground">
                        {[endereco.bairro, endereco.cidade, endereco.estado]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {organizacao.creci && (
                  <p className="pl-1 text-xs text-muted-foreground">
                    CRECI: {organizacao.creci}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      </AnimacaoScroll>

      {/* 6. CTA final */}
      <AnimacaoScroll>
        <SecaoCta
          slug={slug}
          whatsappNumero={organizacao.whatsapp_numero}
          nomeEmpresa={organizacao.nome}
        />
      </AnimacaoScroll>
    </>
  )
}
