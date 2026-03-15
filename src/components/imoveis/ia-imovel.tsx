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

type IAImovelProps = {
  imovelId: string
  tituloIA: string | null
  descricaoIA: string | null
}

export function IAImovel({ imovelId, tituloIA, descricaoIA }: IAImovelProps) {
  const [descricao, setDescricao] = useState(descricaoIA ?? "")
  const [titulo, setTitulo] = useState(tituloIA ?? "")
  const [gerandoDescricao, setGerandoDescricao] = useState(false)
  const [melhorando, setMelhorando] = useState(false)
  const [gerandoTitulo, setGerandoTitulo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function handleGerarDescricao() {
    setGerandoDescricao(true)
    const resultado = await gerarDescricaoIA(imovelId)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else if (resultado.texto) {
      setDescricao(resultado.texto)
      toast.success(resultado.sucesso)
    }
    setGerandoDescricao(false)
  }

  async function handleMelhorarTexto() {
    if (!descricao.trim()) {
      toast.error("Escreva ou gere uma descrição primeiro")
      return
    }
    setMelhorando(true)
    const resultado = await melhorarTextoIA(descricao, imovelId)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else if (resultado.texto) {
      setDescricao(resultado.texto)
      toast.success(resultado.sucesso)
    }
    setMelhorando(false)
  }

  async function handleGerarTitulo() {
    setGerandoTitulo(true)
    const resultado = await gerarTituloIA(imovelId)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else if (resultado.texto) {
      setTitulo(resultado.texto)
      toast.success(resultado.sucesso)
    }
    setGerandoTitulo(false)
  }

  async function handleSalvar(campo: "titulo_ia" | "descricao_ia", texto: string) {
    if (!texto.trim()) {
      toast.error("Nenhum texto para salvar")
      return
    }
    setSalvando(true)
    const resultado = await salvarTextoIA(imovelId, campo, texto)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
    setSalvando(false)
  }

  const processando = gerandoDescricao || melhorando || gerandoTitulo

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
              {gerandoDescricao ? (
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
              {melhorando ? (
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
              disabled={salvando || !descricao.trim()}
            >
              {salvando ? (
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
            {gerandoTitulo ? (
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
              disabled={salvando || !titulo.trim()}
            >
              {salvando ? (
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
