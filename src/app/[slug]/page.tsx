import { notFound } from "next/navigation"
import Link from "next/link"
import {
  buscarOrganizacaoPorSlug,
  buscarImoveisDestaque,
} from "@/lib/site/buscar-dados-site"
import { SecaoHero } from "@/components/site/secao-hero"
import { CardImovelPublico } from "@/components/site/card-imovel-publico"
import { Building2, ArrowRight, Phone, Mail, MapPin } from "lucide-react"
import { EstadoVazio } from "@/components/ui/estado-vazio"

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

  const imoveis = await buscarImoveisDestaque(organizacao.id)

  const endereco = organizacao.endereco as {
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    estado?: string
  } | null

  return (
    <>
      {/* Hero */}
      <SecaoHero organizacao={organizacao} />

      {/* Imóveis em destaque */}
      <section className="mx-auto max-w-6xl px-4 py-16">
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
      </section>

      {/* Sobre a imobiliária */}
      <section className="border-t bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-2xl font-bold text-foreground">
            Sobre a {organizacao.nome}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizacao.telefone && (
              <div className="flex items-start gap-3 rounded-lg border bg-background p-5">
                <Phone className="mt-0.5 h-5 w-5 text-[var(--site-primaria)]" />
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">
                    {organizacao.telefone}
                  </p>
                </div>
              </div>
            )}
            {organizacao.email && (
              <div className="flex items-start gap-3 rounded-lg border bg-background p-5">
                <Mail className="mt-0.5 h-5 w-5 text-[var(--site-primaria)]" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {organizacao.email}
                  </p>
                </div>
              </div>
            )}
            {endereco?.cidade && (
              <div className="flex items-start gap-3 rounded-lg border bg-background p-5">
                <MapPin className="mt-0.5 h-5 w-5 text-[var(--site-primaria)]" />
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
          </div>
          {organizacao.creci && (
            <p className="mt-6 text-xs text-muted-foreground">
              CRECI: {organizacao.creci}
            </p>
          )}
        </div>
      </section>
    </>
  )
}
