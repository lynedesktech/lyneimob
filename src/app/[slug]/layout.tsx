import { notFound } from "next/navigation"
import {
  buscarOrganizacaoPorSlug,
  contarLoteamentosPublicados,
} from "@/lib/site/buscar-dados-site"
import { HeaderSite } from "@/components/site/header-site"
import { FooterSite } from "@/components/site/footer-site"
import { ProvedorTemaClaro } from "@/components/site/provedor-tema-claro"
import { BotaoWhatsappFlutuante } from "@/components/site/botao-whatsapp-flutuante"
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

  const logoUrl = org.logo_url || undefined
  const configs = extrairConfiguracoes(
    org.configuracoes_site as Record<string, unknown>
  )

  return {
    title: {
      default: `${org.nome} — Imóveis`,
      template: `%s | ${org.nome}`,
    },
    description: `Confira os imóveis disponíveis na ${org.nome}. Encontre casas, apartamentos e muito mais.`,
    ...(configs.favicon_url && {
      icons: {
        icon: configs.favicon_url,
        apple: configs.favicon_url,
      },
    }),
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: org.nome,
      title: `${org.nome} — Imóveis`,
      description: `Confira os imóveis disponíveis na ${org.nome}. Encontre casas, apartamentos e muito mais.`,
      ...(logoUrl && { images: [{ url: logoUrl, width: 400, height: 400, alt: org.nome }] }),
    },
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

  const [configs, totalLoteamentos] = await Promise.all([
    Promise.resolve(
      extrairConfiguracoes(
        organizacao.configuracoes_site as Record<string, unknown>
      )
    ),
    contarLoteamentosPublicados(organizacao.id),
  ])

  return (
    <ProvedorTemaClaro>
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
        <HeaderSite
          organizacao={organizacao}
          temLoteamentos={totalLoteamentos > 0}
        />
        <main className="flex-1">{children}</main>
        <FooterSite organizacao={organizacao} />
        {organizacao.whatsapp_numero && (
          <BotaoWhatsappFlutuante
            whatsappNumero={organizacao.whatsapp_numero}
            nomeEmpresa={organizacao.nome}
          />
        )}
      </div>
    </ProvedorTemaClaro>
  )
}
