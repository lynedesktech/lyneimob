import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function SecaoHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#023373] via-[#01245a] to-[#011a42] pt-16">
      {/* Padrão decorativo de fundo */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300 blur-3xl" />
      </div>

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            CRM imobiliário com IA integrada
          </div>

          {/* Headline */}
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Venda mais imóveis com{" "}
            <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              IA que trabalha por você
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
            O CRM que analisa, sugere e automatiza — do cadastro do imóvel ao
            fechamento do negócio. Tudo com inteligência artificial.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/cadastro">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-xl bg-white px-8 text-base font-semibold text-[#023373] shadow-lg shadow-black/20 transition-all hover:bg-white/90 hover:shadow-xl"
              >
                Comece grátis por 14 dias
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#video">
              <Button
                variant="ghost"
                size="lg"
                className="h-12 gap-2 rounded-xl border border-white/20 px-8 text-base font-medium text-white hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                Veja como funciona
              </Button>
            </a>
          </div>

          {/* Texto de confiança */}
          <p className="mt-8 text-sm text-white/50">
            Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </div>

      {/* Onda decorativa inferior */}
      <div className="relative h-16 sm:h-24">
        <svg
          className="absolute bottom-0 w-full text-background"
          viewBox="0 0 1440 80"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  )
}
