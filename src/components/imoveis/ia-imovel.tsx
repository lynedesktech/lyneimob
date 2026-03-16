"use client"

import { useState } from "react"
import {
  gerarDescricaoIA,
  melhorarTextoIA,
  gerarTituloIA,
  salvarTextoIA,
} from "@/actions/ia-imoveis"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Sparkles, Wand2, Type, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAcaoIA } from "@/hooks/use-acao-ia"

type IAImovelProps = {
  imovelId: string
  tituloIA: string | null
  descricaoIA: string | null
}

export function IAImovel({ imovelId, tituloIA, descricaoIA }: IAImovelProps) {
  const [descricao, setDescricao] = useState(descricaoIA ?? "")
  const [titulo, setTitulo] = useState(tituloIA ?? "")
  const acaoDescricao = useAcaoIA()
  const acaoMelhorar = useAcaoIA()
  const acaoTitulo = useAcaoIA()
  const acaoSalvar = useAcaoIA()

  function handleGerarDescricao() {
    acaoDescricao.executar(
      () => gerarDescricaoIA(imovelId),
      (r) => setDescricao(r.texto || "")
    )
  }

  function handleMelhorarTexto() {
    if (!descricao.trim()) {
      toast.error("Escreva ou gere uma descrição primeiro")
      return
    }
    acaoMelhorar.executar(
      () => melhorarTextoIA(descricao, imovelId),
      (r) => setDescricao(r.texto || "")
    )
  }

  function handleGerarTitulo() {
    acaoTitulo.executar(
      () => gerarTituloIA(imovelId),
      (r) => setTitulo(r.texto || "")
    )
  }

  function handleSalvar(campo: "titulo_ia" | "descricao_ia", texto: string) {
    if (!texto.trim()) {
      toast.error("Nenhum texto para salvar")
      return
    }
    acaoSalvar.executar(() => salvarTextoIA(imovelId, campo, texto))
  }

  const processando = acaoDescricao.carregando || acaoMelhorar.carregando || acaoTitulo.carregando

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Descrição IA */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Descrição com IA
          </CardTitle>
          <CardDescription>
            Gere ou melhore a descrição do imóvel usando inteligência artificial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGerarDescricao}
              disabled={processando}
            >
              {acaoDescricao.carregando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Gerar descrição
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMelhorarTexto}
              disabled={processando || !descricao.trim()}
            >
              {acaoMelhorar.carregando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Melhorar texto
            </Button>
          </div>

          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="A descrição gerada pela IA aparecerá aqui. Você pode editar antes de salvar."
            rows={8}
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleSalvar("descricao_ia", descricao)}
              disabled={acaoSalvar.carregando || !descricao.trim()}
            >
              {acaoSalvar.carregando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar descrição
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Título IA */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4" />
            Título com IA
          </CardTitle>
          <CardDescription>
            Gere um título otimizado para o anúncio do imóvel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGerarTitulo}
            disabled={processando}
          >
            {acaoTitulo.carregando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Type className="mr-2 h-4 w-4" />
            )}
            Gerar título
          </Button>

          <Textarea
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="O título gerado pela IA aparecerá aqui."
            rows={2}
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleSalvar("titulo_ia", titulo)}
              disabled={acaoSalvar.carregando || !titulo.trim()}
            >
              {acaoSalvar.carregando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar título
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
