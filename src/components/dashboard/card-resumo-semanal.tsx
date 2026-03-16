"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react"
import { buscarOuGerarResumoSemanal, regenerarResumoSemanal } from "@/actions/resumo-semanal"
import { formatarDataCurta } from "@/lib/formatadores"
import { toast } from "sonner"
import type { ResumoSemanal } from "@/types/resumo-semanal"

export function CardResumoSemanal() {
  const queryClient = useQueryClient()
  const [resumo, setResumo] = useState<ResumoSemanal | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["resumo-semanal"],
    queryFn: async () => {
      const resultado = await buscarOuGerarResumoSemanal()
      if (resultado.erro) throw new Error(resultado.erro)
      return resultado.resumo!
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false,
  })

  useEffect(() => {
    if (data) setResumo(data)
  }, [data])

  const { mutate: regenerar, isPending: regenerando } = useMutation({
    mutationFn: async () => {
      const resultado = await regenerarResumoSemanal()
      if (resultado.erro) throw new Error(resultado.erro)
      return resultado.resumo!
    },
    onSuccess: (novoResumo) => {
      setResumo(novoResumo)
      queryClient.invalidateQueries({ queryKey: ["resumo-semanal"] })
      toast.success("Resumo atualizado!")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">Resumo da Semana</CardTitle>
            <CardDescription>Gerando análise com IA...</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">Resumo da Semana</CardTitle>
            <CardDescription className="text-destructive">
              {error.message}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  const dadosResumo = resumo || data
  if (!dadosResumo) return null

  // Semana sem movimentações
  const semMovimentacao = !dadosResumo.conteudo

  const periodoLabel = dadosResumo.semana_inicio && dadosResumo.semana_fim
    ? `${formatarDataCurta(dadosResumo.semana_inicio)} — ${formatarDataCurta(dadosResumo.semana_fim)}`
    : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Resumo da Semana</CardTitle>
              {periodoLabel && (
                <Badge variant="secondary" className="text-xs">
                  {periodoLabel}
                </Badge>
              )}
            </div>
            <CardDescription>
              {semMovimentacao
                ? "Nenhuma movimentação registrada esta semana"
                : "Análise gerada por IA com base nos seus dados"}
            </CardDescription>
          </div>
        </div>

        {!semMovimentacao && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => regenerar()}
            disabled={regenerando}
            title="Gerar novo resumo"
          >
            <RefreshCw className={`h-4 w-4 ${regenerando ? "animate-spin" : ""}`} />
          </Button>
        )}
      </CardHeader>

      {!semMovimentacao && (
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {dadosResumo.conteudo}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
