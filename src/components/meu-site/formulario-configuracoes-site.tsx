"use client"

import { useActionState, useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Globe, Palette, Type, Info, Save, RotateCcw, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { UploadImagemSite } from "@/components/meu-site/upload-imagem-site"
import { PreviewCores } from "@/components/meu-site/preview-cores"
import { ConfiguracaoDominio } from "@/components/meu-site/configuracao-dominio"
import { salvarConfiguracoesSite } from "@/actions/configuracoes-site"
import { extrairConfiguracoes, configPadrao } from "@/types/configuracoes-site"
import { extrairCoresDaImagem } from "@/lib/extrair-cores-imagem"
import type { ConfiguracoesSite } from "@/types/configuracoes-site"
import type { Organizacao } from "@/types/database"
import type { DominioCustomizado } from "@/types/dominios"
import { toast } from "sonner"

type Props = {
  organizacao: Organizacao
  dominio: DominioCustomizado | null
  appHostname: string
}

export function FormularioConfiguracoesSite({ organizacao, dominio, appHostname }: Props) {
  const router = useRouter()
  const configsIniciais = extrairConfiguracoes(
    organizacao.configuracoes_site as Record<string, unknown>
  )
  const [configs, setConfigs] = useState<ConfiguracoesSite>(configsIniciais)
  const [logoUrl, setLogoUrl] = useState<string | null>(organizacao.logo_url || null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(configsIniciais.favicon_url)

  // Action para salvar
  const [estado, formAction] = useActionState(salvarConfiguracoesSite, {})
  const [transitando, iniciarTransicao] = useTransition()
  const pendente = transitando

  // Mostrar toast quando a action retornar
  useEffect(() => {
    if (estado.sucesso) toast.success(estado.sucesso)
    if (estado.erro) toast.error(estado.erro)
  }, [estado])

  // Helpers para atualizar parcialmente
  function atualizarCores(campo: string, valor: string) {
    setConfigs((prev) => ({
      ...prev,
      cores: { ...prev.cores, [campo]: valor },
    }))
  }

  function atualizarHero(campo: string, valor: string | null) {
    setConfigs((prev) => ({
      ...prev,
      hero: { ...prev.hero, [campo]: valor },
    }))
  }

  function atualizarSobre(campo: string, valor: string) {
    setConfigs((prev) => ({
      ...prev,
      sobre: { ...prev.sobre, [campo]: valor },
    }))
  }

  async function aoMudarLogo(url: string | null) {
    setLogoUrl(url)

    if (!url) return

    const cores = await extrairCoresDaImagem(url)
    if (!cores) return

    toast("Cores detectadas na logo!", {
      description: "Clique em Aplicar para usar como paleta do site.",
      action: {
        label: "Aplicar",
        onClick: () => {
          setConfigs((prev) => ({
            ...prev,
            cores: {
              primaria: cores.primaria,
              destaque: cores.destaque,
              hero_fundo: cores.heroFundo,
            },
          }))
          toast.success("Paleta de cores atualizada! Salve para aplicar.")
        },
      },
    })
  }

  function restaurarPadrao() {
    setConfigs(configPadrao())
    toast.info("Valores restaurados para o padrão. Salve para aplicar.")
  }

  return (
    <form
      action={(formData) => {
        formData.set("configuracoes", JSON.stringify({ ...configs, favicon_url: faviconUrl }))
        formData.set("logo_url", logoUrl || "")
        iniciarTransicao(() => {
          formAction(formData)
        })
      }}
    >
      {/* Header com ações */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meu Site</h1>
          <p className="text-sm text-muted-foreground">
            Personalize a aparência do site público da sua imobiliária
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`/${organizacao.slug}`, "_blank")
            }
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Ver meu site
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={restaurarPadrao}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restaurar padrão
          </Button>
          <Button type="submit" size="sm" disabled={pendente}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {pendente ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identidade" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 sm:w-auto sm:grid-cols-none sm:flex">
          <TabsTrigger value="identidade">
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="cores">
            <Palette className="mr-1.5 h-3.5 w-3.5" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="hero">
            <Type className="mr-1.5 h-3.5 w-3.5" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="sobre">
            <Info className="mr-1.5 h-3.5 w-3.5" />
            Sobre Nós
          </TabsTrigger>
          <TabsTrigger value="dominio">
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            Domínio
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB CORES ========== */}
        <TabsContent value="cores">
          <Card>
            <CardHeader>
              <CardTitle>Paleta de Cores</CardTitle>
              <CardDescription>
                Escolha as cores que definem a identidade visual do seu site. A cor
                primária aparece no header, footer, botões e destaques.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tema do site */}
              <div className="space-y-2">
                <Label>Tema do site</Label>
                <p className="text-xs text-muted-foreground">
                  Define se o site público aparece com fundo claro ou escuro, independente do tema do sistema.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfigs((prev) => ({ ...prev, tema: "claro" }))}
                    className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      configs.tema === "claro"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full bg-white border border-border" />
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfigs((prev) => ({ ...prev, tema: "escuro" }))}
                    className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      configs.tema === "escuro"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full bg-zinc-900 border border-border" />
                    Escuro
                  </button>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {/* Cor primária */}
                <div className="space-y-2">
                  <Label htmlFor="cor-primaria">Cor primária</Label>
                  <p className="text-xs text-muted-foreground">
                    Header, footer, botões e textos de destaque
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="cor-primaria"
                      value={configs.cores.primaria}
                      onChange={(e) => atualizarCores("primaria", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border"
                    />
                    <Input
                      value={configs.cores.primaria}
                      onChange={(e) => atualizarCores("primaria", e.target.value)}
                      className="w-28 font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Cor de destaque */}
                <div className="space-y-2">
                  <Label htmlFor="cor-destaque">Cor de destaque</Label>
                  <p className="text-xs text-muted-foreground">
                    Links, elementos interativos e acentos
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="cor-destaque"
                      value={configs.cores.destaque}
                      onChange={(e) => atualizarCores("destaque", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border"
                    />
                    <Input
                      value={configs.cores.destaque}
                      onChange={(e) => atualizarCores("destaque", e.target.value)}
                      className="w-28 font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Cor de fundo do hero */}
                <div className="space-y-2">
                  <Label htmlFor="cor-hero">Fundo do Hero</Label>
                  <p className="text-xs text-muted-foreground">
                    Cor de fundo da seção principal da home
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="cor-hero"
                      value={configs.cores.hero_fundo}
                      onChange={(e) => atualizarCores("hero_fundo", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border"
                    />
                    <Input
                      value={configs.cores.hero_fundo}
                      onChange={(e) => atualizarCores("hero_fundo", e.target.value)}
                      className="w-28 font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preview */}
              <div>
                <p className="mb-3 text-sm font-medium">Pré-visualização</p>
                <PreviewCores cores={configs.cores} nomeOrg={organizacao.nome} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB IDENTIDADE ========== */}
        <TabsContent value="identidade">
          <Card>
            <CardHeader>
              <CardTitle>Logo da Imobiliária</CardTitle>
              <CardDescription>
                A logo aparece no header e no footer do seu site público. Envie uma
                imagem quadrada (PNG ou JPG) com fundo transparente para melhor resultado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <UploadImagemSite
                  tipo="logo"
                  urlAtual={logoUrl}
                  onUrlChange={aoMudarLogo}
                  aspecto="square"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Recomendado: imagem quadrada, mínimo 200x200px. Formatos: JPG, PNG ou WebP (até 5MB).
                </p>
              </div>

              <Separator />

              <div>
                <UploadImagemSite
                  tipo="favicon"
                  urlAtual={faviconUrl}
                  onUrlChange={setFaviconUrl}
                  aspecto="square"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Ícone da aba do navegador do seu site. Recomendado: 32x32px. Formatos: ICO, PNG ou SVG (até 1MB).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB HERO ========== */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Seção Hero</CardTitle>
              <CardDescription>
                A seção hero é o banner principal que aparece no topo da página
                inicial do seu site. Personalize o texto e a imagem de fundo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero-titulo">Título principal</Label>
                  <Input
                    id="hero-titulo"
                    value={configs.hero.titulo}
                    onChange={(e) => atualizarHero("titulo", e.target.value)}
                    placeholder="Encontre o imóvel ideal com a {empresa}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <strong>{"{empresa}"}</strong> onde quiser que o nome da sua imobiliária apareça em destaque. Ex: &quot;Os melhores imóveis da {"{empresa}"}&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-subtitulo">Subtítulo</Label>
                  <Textarea
                    id="hero-subtitulo"
                    value={configs.hero.subtitulo}
                    onChange={(e) => atualizarHero("subtitulo", e.target.value)}
                    placeholder="Explore nossos imóveis disponíveis..."
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              <UploadImagemSite
                tipo="hero-bg"
                urlAtual={configs.hero.imagem_fundo_url}
                onUrlChange={(url) => atualizarHero("imagem_fundo_url", url)}
                aspecto="video"
              />
              <p className="text-xs text-muted-foreground">
                Se adicionada, a imagem aparece como fundo do hero com um overlay escuro
                para manter o texto legível. Recomendado: 1920x600px ou maior.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB SOBRE ========== */}
        <TabsContent value="sobre">
          <Card>
            <CardHeader>
              <CardTitle>Página Sobre Nós</CardTitle>
              <CardDescription>
                Conte a história da sua imobiliária. Essas informações aparecem na
                página &quot;Sobre&quot; do seu site público.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sobre-titulo">Título da página</Label>
                <Input
                  id="sobre-titulo"
                  value={configs.sobre.titulo}
                  onChange={(e) => atualizarSobre("titulo", e.target.value)}
                  placeholder="Sobre Nós"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sobre-historia">Nossa história</Label>
                <Textarea
                  id="sobre-historia"
                  value={configs.sobre.historia}
                  onChange={(e) => atualizarSobre("historia", e.target.value)}
                  placeholder="Conte a história da sua imobiliária... Quando foi fundada, como começou, o que a motiva..."
                  rows={5}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sobre-missao">Missão</Label>
                  <Textarea
                    id="sobre-missao"
                    value={configs.sobre.missao}
                    onChange={(e) => atualizarSobre("missao", e.target.value)}
                    placeholder="Qual o propósito da sua imobiliária?"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobre-visao">Visão</Label>
                  <Textarea
                    id="sobre-visao"
                    value={configs.sobre.visao}
                    onChange={(e) => atualizarSobre("visao", e.target.value)}
                    placeholder="Onde a imobiliária quer chegar?"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobre-valores">Valores</Label>
                  <Textarea
                    id="sobre-valores"
                    value={configs.sobre.valores}
                    onChange={(e) => atualizarSobre("valores", e.target.value)}
                    placeholder="Quais princípios guiam o trabalho?"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB DOMÍNIO ========== */}
        <TabsContent value="dominio">
          <ConfiguracaoDominio dominio={dominio} appHostname={appHostname} />
        </TabsContent>
      </Tabs>
    </form>
  )
}
