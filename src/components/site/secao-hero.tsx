import Image from "next/image"
import type { OrganizacaoSite } from "@/lib/site/buscar-dados-site"
import { extrairConfiguracoes } from "@/types/configuracoes-site"
import { BuscaHeroModerna } from "@/components/site/busca-hero-moderna"

type Props = {
  organizacao: OrganizacaoSite
  temLoteamentos: boolean
}

export function SecaoHero({ organizacao, temLoteamentos }: Props) {
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
                  <>
                    <br className="hidden sm:block" />
                    <span style={{ color: 'var(--site-destaque)' }}> {organizacao.nome}</span>
                  </>
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

        {/* Busca moderna */}
        <BuscaHeroModerna slug={organizacao.slug} temLoteamentos={temLoteamentos} />
      </div>
    </section>
  )
}
