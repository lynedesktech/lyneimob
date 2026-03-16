import { notFound } from "next/navigation"
import { buscarOrganizacaoPorSlug } from "@/lib/site/buscar-dados-site"
import { extrairConfiguracoes } from "@/types/configuracoes-site"
import { Target, Eye, Heart, BookOpen } from "lucide-react"
import type { Metadata } from "next"

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const org = await buscarOrganizacaoPorSlug(slug)

  if (!org) return {}

  return {
    title: "Sobre Nós",
    description: `Conheça a ${org.nome}. Nossa história, missão, visão e valores.`,
  }
}

export default async function SobrePage({
  params,
}: {
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

  const { sobre } = configs
  const temConteudo = sobre.historia || sobre.missao || sobre.visao || sobre.valores

  return (
    <>
      {/* Mini hero */}
      <section
        className="px-4 py-16 text-center text-white sm:py-20"
        style={{ backgroundColor: "var(--site-primaria)" }}
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {sobre.titulo || "Sobre Nós"}
          </h1>
          <p className="mt-3 text-white/80">
            Conheça a história e os valores da {organizacao.nome}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {temConteudo ? (
          <div className="space-y-12">
            {/* História */}
            {sobre.historia && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen
                    className="h-5 w-5"
                    style={{ color: "var(--site-primaria)" }}
                  />
                  <h2 className="text-xl font-bold">Nossa História</h2>
                </div>
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {sobre.historia}
                </p>
              </section>
            )}

            {/* Missão, Visão, Valores */}
            {(sobre.missao || sobre.visao || sobre.valores) && (
              <div className="grid gap-6 sm:grid-cols-3">
                {sobre.missao && (
                  <div className="rounded-lg border p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: "var(--site-primaria)" }}
                      >
                        <Target className="h-4 w-4" />
                      </div>
                      <h3 className="font-semibold">Missão</h3>
                    </div>
                    <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                      {sobre.missao}
                    </p>
                  </div>
                )}

                {sobre.visao && (
                  <div className="rounded-lg border p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: "var(--site-primaria)" }}
                      >
                        <Eye className="h-4 w-4" />
                      </div>
                      <h3 className="font-semibold">Visão</h3>
                    </div>
                    <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                      {sobre.visao}
                    </p>
                  </div>
                )}

                {sobre.valores && (
                  <div className="rounded-lg border p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: "var(--site-primaria)" }}
                      >
                        <Heart className="h-4 w-4" />
                      </div>
                      <h3 className="font-semibold">Valores</h3>
                    </div>
                    <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                      {sobre.valores}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dados da imobiliária */}
            <section className="rounded-lg border bg-muted/30 p-6 text-center">
              <p className="text-lg font-semibold">{organizacao.nome}</p>
              {organizacao.creci && (
                <p className="mt-1 text-sm text-muted-foreground">
                  CRECI: {organizacao.creci}
                </p>
              )}
              {organizacao.telefone && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {organizacao.telefone}
                </p>
              )}
              {organizacao.email && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {organizacao.email}
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold text-muted-foreground">
              Em breve
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              A {organizacao.nome} ainda está preparando as informações sobre a
              empresa. Enquanto isso, explore nossos imóveis ou entre em contato!
            </p>
          </div>
        )}
      </div>
    </>
  )
}
