"use client"

import { useState } from "react"
import {
  gerarBriefingVisita,
  gerarSugestaoPosAtividade,
} from "@/actions/ia-atividades"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Brain,
  ClipboardList,
  Lightbulb,
  Loader2,
} from "lucide-react"
import { useAcaoIA } from "@/hooks/use-acao-ia"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import type { AtividadeComRelacoes } from "@/types/database"

interface IAAtividadeProps {
  atividade: AtividadeComRelacoes
}

export function IAAtividade({ atividade }: IAAtividadeProps) {
  const [briefing, setBriefing] = useState(atividade.briefing_ia || "")
  const [sugestao, setSugestao] = useState(atividade.sugestao_ia || "")
  const acaoBriefing = useAcaoIA()
  const acaoSugestao = useAcaoIA()

  function handleGerarBriefing() {
    acaoBriefing.executar(
      () => gerarBriefingVisita(atividade.id),
      (r) => setBriefing(r.texto || "")
    )
  }

  function handleGerarSugestao() {
    acaoSugestao.executar(
      () => gerarSugestaoPosAtividade(atividade.id),
      (r) => setSugestao(r.texto || "")
    )
  }

  return (
    <div className="space-y-4">
      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2">
        {atividade.status !== "concluida" && (
          <Button
            onClick={handleGerarBriefing}
            disabled={acaoBriefing.carregando}
            variant="outline"
          >
            {acaoBriefing.carregando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="mr-2 h-4 w-4" />
            )}
            Gerar Briefing
          </Button>
        )}

        {atividade.status === "concluida" && (
          <Button
            onClick={handleGerarSugestao}
            disabled={acaoSugestao.carregando}
            variant="outline"
          >
            {acaoSugestao.carregando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            Sugerir Próximo Passo
          </Button>
        )}
      </div>

      {/* Briefing */}
      {briefing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4" />
              Briefing da Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {briefing}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugestão */}
      {sugestao && (
        <>
          {briefing && <Separator />}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4" />
                Sugestão de Próximo Passo
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
      {!briefing && !sugestao && (
        <EstadoVazio
          icone={Brain}
          titulo="Sem análises ainda"
          descricao={
            atividade.status === "concluida"
              ? "Use o botão acima para gerar uma sugestão de próximo passo com IA"
              : "Use o botão acima para gerar um briefing de preparação com IA"
          }
          className="py-6"
        />
      )}
    </div>
  )
}
