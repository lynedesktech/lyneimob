import { notFound } from "next/navigation"
import { buscarOrganizacaoPorSlug } from "@/lib/site/buscar-dados-site"
import { FormularioContato } from "@/components/site/formulario-contato"
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react"
import { formatarTelefone } from "@/lib/formatadores"
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
    title: "Contato",
    description: `Entre em contato com a ${org.nome}. Estamos prontos para ajudar você a encontrar o imóvel ideal.`,
  }
}

export default async function ContatoPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { slug } = await params
  const query = await searchParams

  const organizacao = await buscarOrganizacaoPorSlug(slug)
  if (!organizacao) {
    notFound()
  }

  const endereco = organizacao.endereco as {
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    estado?: string
  } | null

  const enderecoTexto = endereco
    ? [
        endereco.logradouro,
        endereco.numero,
        endereco.bairro,
        endereco.cidade,
        endereco.estado,
      ]
        .filter(Boolean)
        .join(", ")
    : null

  const whatsappNumero = organizacao.whatsapp_numero?.replace(/\D/g, "")

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Entre em contato</h1>
        <p className="mt-2 text-muted-foreground">
          Preencha o formulário abaixo ou use nossos canais de atendimento.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Formulário (3/5) */}
        <AnimacaoScroll className="lg:col-span-3" direcao="left">
          <div className="rounded-lg border bg-background p-6 sm:p-8">
            <h2 className="mb-6 text-lg font-semibold">Envie sua mensagem</h2>
            <FormularioContato
              organizacaoSlug={slug}
              imovelCodigo={query.imovel}
            />
          </div>
        </AnimacaoScroll>

        {/* Informações de contato (2/5) */}
        <AnimacaoScroll className="lg:col-span-2" direcao="right" delay={0.15}>
          <div className="space-y-6">
            <div className="rounded-lg border bg-background p-6">
              <h2 className="mb-4 text-lg font-semibold">
                Canais de atendimento
              </h2>
              <div className="space-y-4">
                {organizacao.telefone && (
                  <a
                    href={`tel:${organizacao.telefone}`}
                    className="flex items-center gap-3 text-sm transition-colors hover:text-[var(--site-primaria)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--site-primaria)]/10">
                      <Phone className="h-4 w-4 text-[var(--site-primaria)]" />
                    </div>
                    <div>
                      <p className="font-medium">Telefone</p>
                      <p className="text-muted-foreground">
                        {formatarTelefone(organizacao.telefone)}
                      </p>
                    </div>
                  </a>
                )}

                {organizacao.email && (
                  <a
                    href={`mailto:${organizacao.email}`}
                    className="flex items-center gap-3 text-sm transition-colors hover:text-[var(--site-primaria)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--site-primaria)]/10">
                      <Mail className="h-4 w-4 text-[var(--site-primaria)]" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">
                        {organizacao.email}
                      </p>
                    </div>
                  </a>
                )}

                {whatsappNumero && (
                  <a
                    href={`https://wa.me/${whatsappNumero}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm transition-colors hover:text-[var(--site-primaria)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                      <MessageCircle className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-muted-foreground">
                        Atendimento rápido
                      </p>
                    </div>
                  </a>
                )}

                {enderecoTexto && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--site-primaria)]/10">
                      <MapPin className="h-4 w-4 text-[var(--site-primaria)]" />
                    </div>
                    <div>
                      <p className="font-medium">Endereço</p>
                      <p className="text-muted-foreground">{enderecoTexto}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {organizacao.creci && (
              <p className="text-center text-xs text-muted-foreground">
                CRECI: {organizacao.creci}
              </p>
            )}
          </div>
        </AnimacaoScroll>
      </div>
    </div>
  )
}
