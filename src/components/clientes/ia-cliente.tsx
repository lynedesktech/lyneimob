"use client"

import { useState } from "react"
import Link from "next/link"
import {
  gerarScoreLead,
  gerarResumoCliente,
  matchInteligente,
} from "@/actions/ia-clientes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreBadge } from "./score-badge"
import {
  Sparkles,
  TrendingUp,
  FileText,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

type SugestaoMatch = {
  imovel_id: string
  score: number
  justificativa: string
}

type IAClienteProps = {
  clienteId: string
  scoreAtual: number
  resumoAtual: string | null
}

export function IACliente({ clienteId, scoreAtual, resumoAtual }: IAClienteProps) {
  const [score, setScore] = useState(scoreAtual)
  const [resumo, setResumo] = useState(resumoAtual ?? "")
  const [sugestoes, setSugestoes] = useState<SugestaoMatch[]>([])

  const [calculandoScore, setCalculandoScore] = useState(false)
  const [gerandoResumo, setGerandoResumo] = useState(false)
  const [buscandoMatch, setBuscandoMatch] = useState(false)

  async function handleCalcularScore() {
    setCalculandoScore(true)
    const resultado = await gerarScoreLead(clienteId)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else if (resultado.score !== undefined) {
      setScore(resultado.score)
      toast.success(resultado.sucesso)
    }
    setCalculandoScore(false)
  }

  async function handleGerarResumo() {
    setGerandoResumo(true)
    const resultado = await gerarResumoCliente(clienteId)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else if (resultado.texto) {
      setResumo(resultado.texto)
      toast.success(resultado.sucesso)
    }
    setGerandoResumo(false)
  }

  async function handleMatchInteligente() {
    setBuscandoMatch(true)
    const resultado = await matchInteligente(clienteId)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else if (resultado.sugestoes) {
      setSugestoes(resultado.sugestoes)
      toast.success(resultado.sucesso)
    }
    setBuscandoMatch(false)
  }

  const processando = calculandoScore || gerandoResumo || buscandoMatch

  return (
    <div className="space-y-4">
      {/* Score de Lead */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Score de Lead
          </CardTitle>
          <CardDescription>
            Pontuação de 0 a 100 baseada no perfil e engajamento do cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{score}</div>
            <ScoreBadge score={score} />
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCalcularScore}
              disabled={processando}
            >
              {calculandoScore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              {score > 0 ? "Recalcular" : "Calcular score"}
            </Button>
          </div>

          {/* Barra visual */}
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Resumo do Perfil
          </CardTitle>
          <CardDescription>
            Análise resumida do cliente gerada por IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGerarResumo}
            disabled={processando}
          >
            {gerandoResumo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {resumo ? "Gerar novo resumo" : "Gerar resumo"}
          </Button>

          {resumo ? (
            <div className="rounded-md bg-muted/50 p-4 text-sm leading-relaxed">
              {resumo}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Gerar resumo&quot; para a IA analisar o perfil deste cliente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Match Inteligente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Match Inteligente
          </CardTitle>
          <CardDescription>
            A IA sugere imóveis que combinam com o perfil do cliente, mesmo fora dos critérios exatos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMatchInteligente}
            disabled={processando}
          >
            {buscandoMatch ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {sugestoes.length > 0 ? "Buscar novamente" : "Buscar sugestões"}
          </Button>

          {sugestoes.length > 0 ? (
            <div className="space-y-3">
              {sugestoes.map((sugestao, index) => (
                <div
                  key={sugestao.imovel_id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{sugestao.score} pts</Badge>
                      <Link
                        href={`/imoveis/${sugestao.imovel_id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Ver imóvel
                        <ExternalLink className="ml-1 inline h-3 w-3" />
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sugestao.justificativa}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Buscar sugestões&quot; para a IA analisar imóveis compatíveis
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
