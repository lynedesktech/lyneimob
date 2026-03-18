"use client"

import { useState } from "react"
import {
  gerarDescricaoLoteamentoIA,
  melhorarTextoLoteamentoIA,
  salvarDescricaoLoteamentoIA,
} from "@/actions/ia-loteamentos"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Sparkles, Wand2, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAcaoIA } from "@/hooks/use-acao-ia"

type IALoteamentoProps = {
  loteamentoId: string
  descricaoIA: string | null
}

export function IALoteamento({ loteamentoId, descricaoIA }: IALoteamentoProps) {
  const [descricao, setDescricao] = useState(descricaoIA ?? "")
  const acaoDescricao = useAcaoIA()
  const acaoMelhorar = useAcaoIA()
  const acaoSalvar = useAcaoIA()

  function handleGerarDescricao() {
    acaoDescricao.executar(
      () => gerarDescricaoLoteamentoIA(loteamentoId),
      (r) => setDescricao(r.texto || "")
    )
  }

  function handleMelhorarTexto() {
    if (!descricao.trim()) {
      toast.error("Escreva ou gere uma descrição primeiro")
      return
    }
    acaoMelhorar.executar(
      () => melhorarTextoLoteamentoIA(descricao, loteamentoId),
      (r) => setDescricao(r.texto || "")
    )
  }

  function handleSalvar() {
    if (!descricao.trim()) {
      toast.error("Nenhum texto para salvar")
      return
    }
    acaoSalvar.executar(() => salvarDescricaoLoteamentoIA(loteamentoId, descricao))
  }

  const processando = acaoDescricao.carregando || acaoMelhorar.carregando

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          Descrição com IA
        </CardTitle>
        <CardDescription>
          Gere ou melhore a descrição do loteamento usando inteligência artificial
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
            onClick={handleSalvar}
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
  )
}
