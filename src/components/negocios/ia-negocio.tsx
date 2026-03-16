"use client"

import { useState } from "react"
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
import { useAcaoIA } from "@/hooks/use-acao-ia"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import type { NegocioComRelacoes } from "@/types/database"

interface IANegocioProps {
  negocio: NegocioComRelacoes
}

/** Formata sugestão: se for JSON estruturado, exibe formatado; senão, exibe como texto */
function formatarSugestao(texto: string): string {
  try {
    const json = JSON.parse(texto)
    if (json.acao_resumida) {
      const partes = [`AÇÃO: ${json.acao_resumida}`]
      if (json.detalhes) partes.push(`\nCOMO:\n${json.detalhes}`)
      if (json.script) partes.push(`\nSCRIPT:\n${json.script}`)
      return partes.join("\n")
    }
    return texto
  } catch {
    return texto
  }
}

export function IANegocio({ negocio }: IANegocioProps) {
  const [analise, setAnalise] = useState(negocio.analise_ia || "")
  const [sugestao, setSugestao] = useState(negocio.sugestao_ia || "")
  const acaoAnalise = useAcaoIA()
  const acaoSugestao = useAcaoIA()
  const acaoPerda = useAcaoIA()

  function handleAnalisar() {
    acaoAnalise.executar(
      () => analisarNegocio(negocio.id),
      (r) => setAnalise(r.texto || "")
    )
  }

  function handleSugerir() {
    acaoSugestao.executar(
      () => sugerirAcao(negocio.id),
      (r) => setSugestao(r.texto || "")
    )
  }

  function handleAnalisarPerda() {
    acaoPerda.executar(
      () => analisarPerda(negocio.id),
      (r) => setAnalise(r.texto || "")
    )
  }

  return (
    <div className="space-y-4">
      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2">
        {negocio.status === "perdido" ? (
          <Button
            onClick={handleAnalisarPerda}
            disabled={acaoPerda.carregando}
            variant="outline"
          >
            {acaoPerda.carregando ? (
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
              disabled={acaoAnalise.carregando}
              variant="outline"
            >
              {acaoAnalise.carregando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              Analisar Contexto
            </Button>

            <Button
              onClick={handleSugerir}
              disabled={acaoSugestao.carregando}
              variant="outline"
            >
              {acaoSugestao.carregando ? (
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
                {formatarSugestao(sugestao)}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Estado vazio */}
      {!analise && !sugestao && (
        <EstadoVazio
          icone={Brain}
          titulo="Sem análises ainda"
          descricao="Use os botões acima para gerar análises e sugestões com IA"
          className="py-6"
        />
      )}
    </div>
  )
}
