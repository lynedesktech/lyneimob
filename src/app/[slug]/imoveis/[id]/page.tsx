import { notFound } from "next/navigation"
import Link from "next/link"
import {
  buscarOrganizacaoPorSlug,
  buscarImovelPublico,
  buscarImoveisSimilares,
  formatarPreco,
} from "@/lib/site/buscar-dados-site"
import { GaleriaImovel } from "@/components/site/galeria-imovel"
import { CardImovelPublico } from "@/components/site/card-imovel-publico"
import { formatarTelefone } from "@/lib/formatadores"
import { AnimacaoScroll } from "@/components/site/animacao-scroll"
import {
  MapPin,
  BedDouble,
  Bath,
  Car,
  Maximize,
  Building2,
  MessageCircle,
  Mail,
  ArrowLeft,
  Layers,
} from "lucide-react"
import type { Metadata } from "next"

type Params = Promise<{ slug: string; id: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug, id } = await params
  const org = await buscarOrganizacaoPorSlug(slug)
  if (!org) return {}

  const imovel = await buscarImovelPublico(org.id, id)
  if (!imovel) return {}

  const titulo = imovel.titulo_ia || imovel.titulo
  const descricao = imovel.descricao_ia || imovel.descricao || `Imóvel disponível na ${org.nome}`
  const fotoCapa = imovel.imovel_fotos?.find((f: { eh_capa: boolean }) => f.eh_capa) || imovel.imovel_fotos?.[0]

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      type: "article",
      locale: "pt_BR",
      title: titulo,
      description: descricao,
      ...(fotoCapa && { images: [{ url: fotoCapa.url, width: 1200, height: 630, alt: titulo }] }),
    },
  }
}

export default async function DetalheImovelPage({
  params,
}: {
  params: Params
}) {
  const { slug, id } = await params
  const organizacao = await buscarOrganizacaoPorSlug(slug)

  if (!organizacao) {
    notFound()
  }

  const imovel = await buscarImovelPublico(organizacao.id, id)

  if (!imovel) {
    notFound()
  }

  const similares = await buscarImoveisSimilares(organizacao.id, {
    id: imovel.id,
    tipo: imovel.tipo,
    bairro: imovel.bairro,
  })

  const titulo = imovel.titulo_ia || imovel.titulo
  const descricao = imovel.descricao_ia || imovel.descricao

  const precoVenda = imovel.valor
  const precoAluguel = imovel.valor_aluguel

  // Link do WhatsApp com mensagem pré-preenchida
  const whatsappNumero = organizacao.whatsapp_numero?.replace(/\D/g, "")
  const whatsappMensagem = encodeURIComponent(
    `Olá! Tenho interesse no imóvel "${titulo}" (Cód. ${imovel.codigo_interno}). Podemos conversar?`
  )
  const whatsappUrl = whatsappNumero
    ? `https://wa.me/${whatsappNumero}?text=${whatsappMensagem}`
    : null

  const enderecoCompleto = [
    imovel.logradouro,
    imovel.numero,
    imovel.complemento,
    imovel.bairro,
    imovel.cidade,
    imovel.estado,
  ]
    .filter(Boolean)
    .join(", ")

  const caracteristicas = [
    imovel.quartos > 0 && {
      icone: BedDouble,
      label: `${imovel.quartos} ${imovel.quartos === 1 ? "quarto" : "quartos"}`,
    },
    imovel.suites > 0 && {
      icone: BedDouble,
      label: `${imovel.suites} ${imovel.suites === 1 ? "suíte" : "suítes"}`,
    },
    imovel.banheiros > 0 && {
      icone: Bath,
      label: `${imovel.banheiros} ${imovel.banheiros === 1 ? "banheiro" : "banheiros"}`,
    },
    imovel.vagas > 0 && {
      icone: Car,
      label: `${imovel.vagas} ${imovel.vagas === 1 ? "vaga" : "vagas"}`,
    },
    imovel.area_total && {
      icone: Maximize,
      label: `${imovel.area_total}m² total`,
    },
    imovel.area_construida && {
      icone: Building2,
      label: `${imovel.area_construida}m² construída`,
    },
    imovel.andares && {
      icone: Layers,
      label: `${imovel.andares} ${imovel.andares === 1 ? "andar" : "andares"}`,
    },
  ].filter(Boolean) as { icone: React.ElementType; label: string }[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Voltar */}
      <Link
        href={`/${slug}/imoveis`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para imóveis
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Coluna principal (2/3) */}
        <div className="lg:col-span-2">
          {/* Galeria */}
          <GaleriaImovel fotos={imovel.imovel_fotos} titulo={titulo} />

          {/* Título e preço */}
          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{titulo}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cód. {imovel.codigo_interno}
                </p>
              </div>
              <div className="text-right">
                {precoVenda && (
                  <p className="text-2xl font-bold text-[var(--site-primaria)]">
                    {formatarPreco(precoVenda)}
                  </p>
                )}
                {precoAluguel && (
                  <p
                    className={`font-bold text-[var(--site-primaria)] ${precoVenda ? "text-lg" : "text-2xl"}`}
                  >
                    {formatarPreco(precoAluguel)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mês
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Custos adicionais */}
            {(imovel.iptu || imovel.condominio) && (
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                {imovel.iptu && <span>IPTU: {formatarPreco(imovel.iptu)}</span>}
                {imovel.condominio && (
                  <span>Condomínio: {formatarPreco(imovel.condominio)}</span>
                )}
              </div>
            )}
          </div>

          {/* Endereço */}
          {enderecoCompleto && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/30 p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--site-primaria)]" />
              <p className="text-sm">{enderecoCompleto}</p>
            </div>
          )}

          {/* Características */}
          {caracteristicas.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Características</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {caracteristicas.map((car) => (
                  <div
                    key={car.label}
                    className="flex items-center gap-2 rounded-lg border p-3"
                  >
                    <car.icone className="h-4 w-4 text-[var(--site-primaria)]" />
                    <span className="text-sm">{car.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          {descricao && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Descrição</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {descricao}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — Contato (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 rounded-lg border bg-background p-6">
            <h3 className="text-lg font-semibold">Interessado?</h3>
            <p className="text-sm text-muted-foreground">
              Entre em contato com a {organizacao.nome} para mais informações
              sobre este imóvel.
            </p>

            <div className="space-y-3">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Conversar no WhatsApp
                </a>
              )}

              <Link
                href={`/${slug}/contato?imovel=${imovel.codigo_interno}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--site-primaria)] px-4 py-3 text-sm font-medium text-[var(--site-primaria)] transition-colors hover:bg-[var(--site-primaria)]/5"
              >
                <Mail className="h-4 w-4" />
                Enviar mensagem
              </Link>
            </div>

            {/* Dados da imobiliária */}
            <div className="mt-4 space-y-2 border-t pt-4">
              <p className="text-sm font-medium">{organizacao.nome}</p>
              {organizacao.telefone && (
                <p className="text-sm text-muted-foreground">
                  Tel: {formatarTelefone(organizacao.telefone)}
                </p>
              )}
              {organizacao.email && (
                <p className="text-sm text-muted-foreground">
                  {organizacao.email}
                </p>
              )}
              {organizacao.creci && (
                <p className="text-xs text-muted-foreground">
                  CRECI: {organizacao.creci}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Imóveis similares */}
      {similares.length > 0 && (
        <AnimacaoScroll className="mt-12">
          <div className="border-t pt-10">
            <h2 className="mb-6 text-xl font-bold">Imóveis similares</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similares.map((similar) => (
                <CardImovelPublico
                  key={similar.id}
                  imovel={similar}
                  slug={slug}
                />
              ))}
            </div>
          </div>
        </AnimacaoScroll>
      )}
    </div>
  )
}
