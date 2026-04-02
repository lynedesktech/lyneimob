"use client"

import { useActionState, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shuffle, Scale, MousePointerClick, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { salvarConfigDistribuicao } from "@/actions/distribuicao-leads"
import { useConfigDistribuicao } from "@/hooks/use-config-distribuicao"
import { MODOS_DISTRIBUICAO } from "@/types/distribuicao-leads"
import type { ModoDistribuicao } from "@/types/distribuicao-leads"
import { cn } from "@/lib/utils"

const ICONES_MODO: Record<ModoDistribuicao, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  manual: MousePointerClick,
  roleta: Shuffle,
  balanceamento: Scale,
}

export function ConfigDistribuicao() {
  const router = useRouter()
  const { config, corretores, carregando, recarregar } = useConfigDistribuicao()
  const [modoSelecionado, setModoSelecionado] = useState<ModoDistribuicao>("manual")
  const [participantes, setParticipantes] = useState<string[]>([])

  const [estado, formAction, pendente] = useActionState(salvarConfigDistribuicao, {})

  // Sincronizar estado local com dados do servidor
  useEffect(() => {
    if (config) {
      setModoSelecionado(config.modo)
      setParticipantes(config.corretores_participantes)
    }
  }, [config])

  // Feedback de sucesso/erro
  useEffect(() => {
    if (estado.sucesso) {
      toast.success(estado.sucesso)
      router.push("/configuracoes")
    }
    if (estado.erro) {
      toast.error(estado.erro)
    }
  }, [estado, router])

  function toggleParticipante(id: string) {
    setParticipantes((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    )
  }

  if (carregando) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="h-5 w-5" />
          Distribuição de Leads
        </CardTitle>
        <CardDescription>
          Como os leads são atribuídos aos corretores ao serem processados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="modo" value={modoSelecionado} />
          <input
            type="hidden"
            name="corretores_participantes"
            value={JSON.stringify(participantes)}
          />

          {/* Seleção de modo */}
          <div className="grid gap-3 sm:grid-cols-3">
            {MODOS_DISTRIBUICAO.map((modo) => {
              const Icone = ICONES_MODO[modo.valor]
              const selecionado = modoSelecionado === modo.valor

              return (
                <button
                  key={modo.valor}
                  type="button"
                  onClick={() => setModoSelecionado(modo.valor)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                    selecionado
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  {selecionado && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <Icone className={cn("h-5 w-5", selecionado ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-medium text-sm">{modo.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {modo.descricao}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Seleção de corretores participantes (apenas se não for manual) */}
          {modoSelecionado !== "manual" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Corretores participantes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {participantes.length === 0
                    ? "Todos os corretores ativos participam da distribuição."
                    : `${participantes.length} corretor(es) selecionado(s).`}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {corretores.map((corretor) => {
                  const selecionado = participantes.includes(corretor.id)

                  return (
                    <button
                      key={corretor.id}
                      type="button"
                      onClick={() => toggleParticipante(corretor.id)}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        selecionado
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                            selecionado
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {selecionado && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span>{corretor.nome}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {corretor.cargo}
                      </Badge>
                    </button>
                  )
                })}
              </div>

              {participantes.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Nenhum selecionado = todos participam automaticamente.
                </p>
              )}
            </div>
          )}

          {/* Botão salvar */}
          <Button type="submit" disabled={pendente} className="w-full sm:w-auto">
            {pendente ? "Salvando..." : "Salvar configuração"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
