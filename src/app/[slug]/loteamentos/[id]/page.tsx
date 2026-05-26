import { notFound } from "next/navigation"
import Link from "next/link"
import {
  buscarOrganizacaoPorSlug,
  buscarLoteamentoPublico,
  buscarOutrosLoteamentos,
  formatarPreco,
} from "@/lib/site/buscar-dados-site"
import { GaleriaImovel } from "@/components/site/galeria-imovel"
import { CardLoteamentoPublico } from "@/components/site/card-loteamento-publico"
import { formatarTelefone } from "@/lib/formatadores"
import { TabelaLotesPublico } from "@/components/site/tabela-lotes-publico"
import { ResumoLotesPublico } from "@/components/site/resumo-lotes-publico"
import { AnimacaoScroll } from "@/components/site/animacao-scroll"
import { labelsStatusLoteamento } from "@/lib/constantes"
import {
  MapPin,
  MessageCircle,
  Mail,
  ArrowLeft,
} from "lucide-react"
import type { Metadata } from "next"
import type { ImovelFoto } from "@/types/database"

type Params = Promise<{ slug: string; id: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug, id } = await params
  const org = await buscarOrganizacaoPorSlug(slug)
  if (!org) return {}

  const loteamento = await buscarLoteamentoPublico(org.id, id)
  if (!loteamento) return {}

  return {
    title: loteamento.nome,
    description:
      // Descricao manual tem prioridade sobre a gerada por IA.
      // (Bug reportado pelo Angelo: IA estava sobrescrevendo edicao manual)
      loteamento.descricao ||
      loteamento.descricao_ia ||
      `Loteamento disponível na ${org.nome}`,
  }
}

export default async function DetalheLoteamentoPage({
  params,
}: {
  params: Params
}) {
  const { slug, id } = await params
  const organizacao = await buscarOrganizacaoPorSlug(slug)

  if (!organizacao) {
    notFound()
  }

  const loteamento = await buscarLoteamentoPublico(organizacao.id, id)

  if (!loteamento) {
    notFound()
  }

  const outros = await buscarOutrosLoteamentos(organizacao.id, loteamento.id)

  // Descricao manual tem prioridade sobre a gerada por IA
  const descricao = loteamento.descricao || loteamento.descricao_ia

  // Valor mínimo dos lotes disponíveis
  const lotesDisponiveis = loteamento.lotes.filter(
    (l: { status: string; valor: number }) => l.status === "disponivel"
  )
  const valorMinimo =
    lotesDisponiveis.length > 0
      ? Math.min(...lotesDisponiveis.map((l: { valor: number }) => l.valor))
      : null

  // Link do WhatsApp com mensagem pré-preenchida
  const whatsappNumero = organizacao.whatsapp_numero?.replace(/\D/g, "")
  const whatsappMensagem = encodeURIComponent(
    `Olá! Tenho interesse no loteamento "${loteamento.nome}". Podemos conversar?`
  )
  const whatsappUrl = whatsappNumero
    ? `https://wa.me/${whatsappNumero}?text=${whatsappMensagem}`
    : null

  const enderecoCompleto = [
    loteamento.logradouro,
    loteamento.numero,
    loteamento.complemento,
    loteamento.bairro,
    loteamento.cidade,
    loteamento.estado,
  ]
    .filter(Boolean)
    .join(", ")

  // Cast fotos para reutilizar GaleriaImovel
  const fotosGaleria = loteamento.loteamento_fotos as unknown as ImovelFoto[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Voltar */}
      <Link
        href={`/${slug}/loteamentos`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para loteamentos
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Coluna principal (2/3) */}
        <div className="lg:col-span-2">
          {/* Galeria */}
          <GaleriaImovel fotos={fotosGaleria} titulo={loteamento.nome} />

          {/* Título, status e preço */}
          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{loteamento.nome}</h1>
                  <span className="rounded-full bg-[var(--site-primaria)]/10 px-3 py-1 text-xs font-medium text-[var(--site-primaria)]">
                    {labelsStatusLoteamento[loteamento.status]}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {valorMinimo ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      A partir de
                    </p>
                    <p className="text-2xl font-bold text-[var(--site-primaria)]">
                      {formatarPreco(valorMinimo)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-[var(--site-primaria)]">
                    Consulte
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Endereço */}
          {enderecoCompleto && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/30 p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--site-primaria)]" />
              <p className="text-sm">{enderecoCompleto}</p>
            </div>
          )}

          {/* Descrição */}
          {descricao && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Sobre o loteamento</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {descricao}
              </p>
            </div>
          )}

          {/* Resumo de lotes */}
          <div className="mt-6">
            <ResumoLotesPublico
              totalLotes={loteamento.total_lotes}
              lotesDisponiveis={loteamento.lotes_disponiveis}
              lotesReservados={loteamento.lotes_reservados}
            />
          </div>

          {/* Tabela de lotes */}
          <div className="mt-6">
            <TabelaLotesPublico lotes={loteamento.lotes} />
          </div>
        </div>

        {/* Sidebar — Contato (1/3) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 rounded-lg border bg-background p-6">
            <h3 className="text-lg font-semibold">Interessado?</h3>
            <p className="text-sm text-muted-foreground">
              Entre em contato com a {organizacao.nome} para mais informações
              sobre este loteamento.
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
                href={`/${slug}/contato?loteamento=${encodeURIComponent(loteamento.nome)}`}
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

      {/* Outros loteamentos */}
      {outros.length > 0 && (
        <AnimacaoScroll className="mt-12">
          <div className="border-t pt-10">
            <h2 className="mb-6 text-xl font-bold">Outros loteamentos</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {outros.map((outro) => (
                <CardLoteamentoPublico
                  key={outro.id}
                  loteamento={outro}
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
