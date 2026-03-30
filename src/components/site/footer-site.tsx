import Image from "next/image"
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react"
import type { OrganizacaoSite } from "@/lib/site/buscar-dados-site"
import { formatarTelefone } from "@/lib/formatadores"

type Props = {
  organizacao: OrganizacaoSite
}

export function FooterSite({ organizacao }: Props) {
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

  return (
    <footer className="border-t bg-[var(--site-primaria)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Sobre */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              {organizacao.logo_url && (
                <Image
                  src={organizacao.logo_url}
                  alt={organizacao.nome}
                  width={36}
                  height={36}
                  className="rounded brightness-0 invert"
                />
              )}
              <span className="text-lg font-bold">{organizacao.nome}</span>
            </div>
            {organizacao.creci && (
              <p className="text-sm text-white/70">CRECI: {organizacao.creci}</p>
            )}
          </div>

          {/* Contato */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
              Contato
            </h3>
            <div className="space-y-3">
              {organizacao.telefone && (
                <a
                  href={`tel:${organizacao.telefone}`}
                  className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4" />
                  {formatarTelefone(organizacao.telefone)}
                </a>
              )}
              {organizacao.email && (
                <a
                  href={`mailto:${organizacao.email}`}
                  className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  {organizacao.email}
                </a>
              )}
              {organizacao.whatsapp_numero && (
                <a
                  href={`https://wa.me/${organizacao.whatsapp_numero.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Endereço */}
          {enderecoTexto && (
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">
                Endereço
              </h3>
              <p className="flex items-start gap-2 text-sm text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {enderecoTexto}
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 border-t border-white/20 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {organizacao.nome}. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  )
}
