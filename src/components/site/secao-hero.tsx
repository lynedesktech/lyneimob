import Link from "next/link"
import Image from "next/image"
import { Search } from "lucide-react"
import type { OrganizacaoSite } from "@/lib/site/buscar-dados-site"
import { extrairConfiguracoes } from "@/types/configuracoes-site"
import { BuscaRapidaHero } from "@/components/site/busca-rapida-hero"

type Props = {
  organizacao: OrganizacaoSite
}

export function SecaoHero({ organizacao }: Props) {
  const configs = extrairConfiguracoes(
    organizacao.configuracoes_site as Record<string, unknown>
  )
  const temImagem = !!configs.hero.imagem_fundo_url

  return (
    <section
      className="relative px-4 py-20 text-white sm:py-28"
      style={{ backgroundColor: configs.cores.hero_fundo }}
    >
      {/* Imagem de fundo (se configurada) */}
      {temImagem && (
        <>
          <Image
            src={configs.hero.imagem_fundo_url!}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      )}

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
          {configs.hero.titulo.includes("{empresa}") ? (
            configs.hero.titulo.split("{empresa}").map((parte, i, arr) => (
              <span key={i}>
                {parte}
                {i < arr.length - 1 && (
                  <span style={{ color: 'var(--site-destaque)' }}>{organizacao.nome}</span>
                )}
              </span>
            ))
          ) : (
            configs.hero.titulo
          )}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
          {configs.hero.subtitulo}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/${organizacao.slug}/imoveis`}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/90"
            style={{ color: configs.cores.primaria }}
          >
            <Search className="h-4 w-4" />
            Ver imóveis disponíveis
          </Link>
          <Link
            href={`/${organizacao.slug}/contato`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Fale conosco
          </Link>
        </div>

        {/* Busca rápida */}
        <BuscaRapidaHero slug={organizacao.slug} />
      </div>
    </section>
  )
}
