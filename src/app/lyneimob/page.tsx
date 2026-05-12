import type { Metadata } from "next"
import { HeaderLanding } from "@/components/landing/header-landing"
import { SecaoHero } from "@/components/landing/secao-hero"
import { SecaoFuncionalidades } from "@/components/landing/secao-funcionalidades"
import { SecaoVideo } from "@/components/landing/secao-video"
import { SecaoPrecos } from "@/components/landing/secao-precos"
import { SecaoFaq } from "@/components/landing/secao-faq"
import { SecaoCtaFinal } from "@/components/landing/secao-cta-final"
import { FooterLanding } from "@/components/landing/footer-landing"

export const metadata: Metadata = {
  title: "LyneImob — Plataforma de Gestão Imobiliária com IA para Corretores e Imobiliárias",
  description:
    "Venda mais imóveis com IA que trabalha por você. Gestão completa com inteligência artificial, pipeline visual, agente SDR por WhatsApp e site público personalizado.",
}

export default function PaginaInicial() {
  return (
    <div className="min-h-screen">
      <HeaderLanding />
      <SecaoHero />
      <SecaoFuncionalidades />
      <SecaoVideo />
      <SecaoPrecos />
      <SecaoFaq />
      <SecaoCtaFinal />
      <FooterLanding />
    </div>
  )
}
