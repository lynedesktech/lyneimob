import Link from "next/link"
import { MessageCircle, Mail } from "lucide-react"

type Props = {
  slug: string
  whatsappNumero?: string | null
  nomeEmpresa: string
}

export function SecaoCta({ slug, whatsappNumero, nomeEmpresa }: Props) {
  const whatsappLimpo = whatsappNumero?.replace(/\D/g, "")
  const whatsappUrl = whatsappLimpo
    ? `https://wa.me/${whatsappLimpo}?text=${encodeURIComponent(
        `Olá! Estou visitando o site da ${nomeEmpresa} e gostaria de mais informações sobre os imóveis disponíveis.`
      )}`
    : null

  return (
    <section
      className="relative overflow-hidden px-4 py-20"
      style={{ backgroundColor: "var(--site-hero-fundo)" }}
    >
      {/* Detalhe decorativo */}
      <div
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-10"
        style={{ backgroundColor: "var(--site-destaque)" }}
      />
      <div
        className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-10"
        style={{ backgroundColor: "var(--site-destaque)" }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Encontre o imóvel ideal para você
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
          Nossa equipe está pronta para ajudar você a encontrar o imóvel
          perfeito. Entre em contato e vamos conversar!
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
            >
              <MessageCircle className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          )}
          <Link
            href={`/${slug}/contato`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            <Mail className="h-4 w-4" />
            Enviar mensagem
          </Link>
        </div>
      </div>
    </section>
  )
}
