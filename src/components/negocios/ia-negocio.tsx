"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  analisarNegocio,
  sugerirAcao,
  analisarPerda,
} from "@/actions/ia-negocios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Brain,
  Lightbulb,
  TrendingDown,
  Loader2,
} from "lucide-react"
import type { NegocioComRelacoes } from "@/types/database"

interface IANegocioProps {
  negocio: NegocioComRelacoes
}

export function IANegocio({ negocio }: IANegocioProps) {
  const [analise, setAnalise] = useState(negocio.analise_ia || "")
  const [sugestao, setSugestao] = useState(negocio.sugestao_ia || "")
  const [analisandoContexto, setAnalisandoContexto] = useState(false)
  const [sugerindo, setSugerindo] = useState(false)
  const [analisandoPerda, setAnalisandoPerda] = useState(false)

  async function handleAnalisar() {
    setAnalisandoContexto(true)
    const resultado = await analisarNegocio(negocio.id)
    setAnalisandoContexto(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      setAnalise(resultado.texto || "")
      toast.success(resultado.sucesso)
    }
  }

  async function handleSugerir() {
    setSugerindo(true)
    const resultado = await sugerirAcao(negocio.id)
    setSugerindo(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      setSugestao(resultado.texto || "")
      toast.success(resultado.sucesso)
    }
  }

  async function handleAnalisarPerda() {
    setAnalisandoPerda(true)
    const resultado = await analisarPerda(negocio.id)
    setAnalisandoPerda(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      setAnalise(resultado.texto || "")
      toast.success(resultado.sucesso)
    }
  }

  return (
    <div className="space-y-4">
      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2">
        {negocio.status === "perdido" ? (
          <Button
            onClick={handleAnalisarPerda}
            disabled={analisandoPerda}
            variant="outline"
          >
            {analisandoPerda ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingDown className="mr-2 h-4 w-4" />
            )}
            Analisar Perda
          </Button>
        ) : (
          <>
            <Button
              onClick={handleAnalisar}
              disabled={analisandoContexto}
              variant="outline"
            >
              {analisandoContexto ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              Analisar Contexto
            </Button>

            <Button
              onClick={handleSugerir}
              disabled={sugerindo}
              variant="outline"
            >
              {sugerindo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Sugerir Ação
            </Button>
          </>
        )}
      </div>

      {/* Análise */}
      {analise && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4" />
              {negocio.status === "perdido"
                ? "Análise de Perda"
                : "Análise de Contexto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {analise}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugestão */}
      {sugestao && negocio.status !== "perdido" && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4" />
                Sugestão de Ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                {sugestao}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Estado vazio */}
      {!analise && !sugestao && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Brain className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Use os botões acima para gerar análises e sugestões com IA
          </p>
        </div>
      )}
    </div>
  )
}
