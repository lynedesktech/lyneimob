import { notFound } from "next/navigation"
import { buscarOrganizacaoPorSlug } from "@/lib/site/buscar-dados-site"
import { HeaderSite } from "@/components/site/header-site"
import { FooterSite } from "@/components/site/footer-site"
import { extrairConfiguracoes } from "@/types/configuracoes-site"
import type { Metadata } from "next"

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const org = await buscarOrganizacaoPorSlug(slug)

  if (!org) {
    return { title: "Imobiliária não encontrada" }
  }

  return {
    title: {
      default: `${org.nome} — Imóveis`,
      template: `%s | ${org.nome}`,
    },
    description: `Confira os imóveis disponíveis na ${org.nome}. Encontre casas, apartamentos e muito mais.`,
  }
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const { slug } = await params
  const organizacao = await buscarOrganizacaoPorSlug(slug)

  if (!organizacao) {
    notFound()
  }

  const configs = extrairConfiguracoes(
    organizacao.configuracoes_site as Record<string, unknown>
  )

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={
        {
          "--site-primaria": configs.cores.primaria,
          "--site-destaque": configs.cores.destaque,
          "--site-hero-fundo": configs.cores.hero_fundo,
        } as React.CSSProperties
      }
    >
      <HeaderSite organizacao={organizacao} />
      <main className="flex-1">{children}</main>
      <FooterSite organizacao={organizacao} />
    </div>
  )
}
