"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Lightbulb,
  RefreshCw,
  CalendarPlus,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { useAcaoIA } from "@/hooks/use-acao-ia"
import { sugerirAcao } from "@/actions/ia-negocios"
import { labelsTipoAtividade } from "@/lib/constantes"

type SugestaoJSON = {
  acao_resumida: string
  tipo_atividade: string
  prazo_dias: number
  detalhes: string
  script: string | null
}

interface CardSugestaoAcaoProps {
  negocioId: string
  sugestaoIA: string | null
  sugestaoResumo: string | null
}

function parsearSugestao(texto: string | null): SugestaoJSON | null {
  if (!texto) return null
  try {
    const json = JSON.parse(texto)
    if (json.acao_resumida) return json as SugestaoJSON
    return null
  } catch {
    return null
  }
}

function formatarPrazo(dias: number): string {
  if (dias <= 0 || dias === 1) return "Hoje"
  if (dias === 2) return "Amanhã"
  return `Em ${dias} dias`
}

export function CardSugestaoAcao({
  negocioId,
  sugestaoIA,
  sugestaoResumo,
}: CardSugestaoAcaoProps) {
  const [textoSugestao, setTextoSugestao] = useState(sugestaoIA)
  const [resumo, setResumo] = useState(sugestaoResumo)
  const acaoIA = useAcaoIA()

  const sugestao = parsearSugestao(textoSugestao)

  function handleAtualizar() {
    acaoIA.executar(
      () => sugerirAcao(negocioId),
      (r) => {
        setTextoSugestao(r.texto || "")
        // Extrair resumo do novo JSON
        try {
          const json = JSON.parse(r.texto || "")
          setResumo(json.acao_resumida || null)
        } catch {
          setResumo(r.texto?.split("\n")[0]?.slice(0, 80) || null)
        }
      }
    )
  }

  // Se não tem sugestão e não é JSON, mas tem texto antigo (formato legado)
  const temTextoLegado = textoSugestao && !sugestao

  // Estado vazio — sem nenhuma sugestão
  if (!textoSugestao && !resumo) {
    return (
      <Card>
        <CardContent className="py-6">
          <EstadoVazio
            icone={Lightbulb}
            titulo="Sem sugestão de ação"
            descricao="A IA pode sugerir a próxima ação para este negócio"
            acao={
              <Button
                onClick={handleAtualizar}
                disabled={acaoIA.carregando}
                size="sm"
              >
                {acaoIA.carregando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="mr-2 h-4 w-4" />
                )}
                Gerar Sugestão
              </Button>
            }
            className="border-none py-4"
          />
        </CardContent>
      </Card>
    )
  }

  // Montar link pra criar atividade pré-preenchida
  const paramsAtividade = new URLSearchParams({ negocio_id: negocioId })
  if (sugestao) {
    paramsAtividade.set("titulo", sugestao.acao_resumida)
    if (sugestao.tipo_atividade) {
      paramsAtividade.set("tipo", sugestao.tipo_atividade)
    }
  } else if (resumo) {
    paramsAtividade.set("titulo", resumo)
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-warning" />
            Próxima Ação Sugerida
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAtualizar}
              disabled={acaoIA.carregando}
              className="h-7 px-2 text-xs"
            >
              {acaoIA.carregando ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sugestão estruturada (JSON) */}
        {sugestao ? (
          <>
            {/* Ação resumida em destaque */}
            <p className="font-medium">{sugestao.acao_resumida}</p>

            {/* Badges: tipo + prazo */}
            <div className="flex items-center gap-2">
              {sugestao.tipo_atividade && (
                <Badge variant="outline" className="text-xs">
                  {labelsTipoAtividade[sugestao.tipo_atividade] || sugestao.tipo_atividade}
                </Badge>
              )}
              {sugestao.prazo_dias != null && (
                <Badge variant="secondary" className="text-xs">
                  {formatarPrazo(sugestao.prazo_dias)}
                </Badge>
              )}
            </div>

            {/* Detalhes */}
            {sugestao.detalhes && (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {sugestao.detalhes}
                </p>
              </div>
            )}

            {/* Script */}
            {sugestao.script && (
              <div className="rounded-md border border-dashed p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Script sugerido
                </p>
                <p className="whitespace-pre-wrap text-sm italic">
                  {sugestao.script}
                </p>
              </div>
            )}
          </>
        ) : temTextoLegado ? (
          /* Formato legado (texto livre) */
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {textoSugestao}
          </div>
        ) : (
          /* Apenas resumo */
          <p className="font-medium">{resumo}</p>
        )}

        {/* Botão criar atividade */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          render={<Link href={`/atividades/novo?${paramsAtividade.toString()}`} />}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Criar Atividade a partir desta Sugestão
        </Button>
      </CardContent>
    </Card>
  )
}
