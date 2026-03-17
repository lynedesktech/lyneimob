"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, ExternalLink, Receipt, Calendar, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardPlano } from "@/components/planos/card-plano"
import { BannerTrial } from "@/components/planos/banner-trial"
import { criarSessaoCheckout, criarSessaoPortal } from "@/actions/billing"
import { PLANOS, formatarPreco } from "@/types/billing"
import type { TipoPlano, InfoAssinatura } from "@/types/billing"

interface PaginaPlanosProps {
  info: InfoAssinatura
  ehAdmin: boolean
}

export function PaginaPlanos({ info, ehAdmin }: PaginaPlanosProps) {
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Mensagens de retorno do Stripe (useEffect para rodar só uma vez)
  const sucesso = searchParams.get("sucesso")
  const cancelado = searchParams.get("cancelado")
  const trialExpirado = searchParams.get("trial_expirado")

  useEffect(() => {
    if (sucesso) {
      toast.success("Assinatura realizada com sucesso! Bem-vindo ao LyneImob.")
      router.replace("/financeiro")
    }
    if (cancelado) {
      toast.info("Checkout cancelado. Você pode tentar novamente quando quiser.")
      router.replace("/financeiro")
    }
  }, [sucesso, cancelado, router])

  async function handleAssinar(plano: TipoPlano) {
    if (!ehAdmin) {
      toast.error("Apenas administradores podem alterar o plano.")
      return
    }

    setCarregando(true)
    try {
      const resultado = await criarSessaoCheckout(plano)
      if (resultado?.erro) {
        toast.error(resultado.erro)
      }
      // Se não deu erro, o redirect acontece automaticamente
    } catch {
      // redirect() do Next.js lança erro — é esperado
    } finally {
      setCarregando(false)
    }
  }

  async function handlePortal() {
    if (!ehAdmin) {
      toast.error("Apenas administradores podem gerenciar a assinatura.")
      return
    }

    setCarregando(true)
    try {
      const resultado = await criarSessaoPortal()
      if (resultado?.erro) {
        toast.error(resultado.erro)
      }
    } catch {
      // redirect()
    } finally {
      setCarregando(false)
    }
  }

  // Labels de status
  const statusLabels: Record<string, { texto: string; cor: string }> = {
    active: { texto: "Ativo", cor: "bg-success/10 text-success" },
    trialing: { texto: "Em teste", cor: "bg-info/10 text-info" },
    past_due: { texto: "Pagamento pendente", cor: "bg-warning/10 text-warning" },
    canceled: { texto: "Cancelado", cor: "bg-destructive/10 text-destructive" },
  }

  const statusAtual = statusLabels[info.plano_status] || statusLabels.active
  const planoConfig = PLANOS[info.plano]

  // Texto da próxima cobrança
  function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  // Status da fatura em português
  const statusFatura: Record<string, { texto: string; cor: string }> = {
    paid: { texto: "Pago", cor: "text-success" },
    open: { texto: "Em aberto", cor: "text-warning" },
    void: { texto: "Cancelado", cor: "text-muted-foreground" },
    uncollectible: { texto: "Não cobrado", cor: "text-muted-foreground" },
    unknown: { texto: "—", cor: "text-muted-foreground" },
  }

  return (
    <div className="space-y-6">
      {/* Banner trial */}
      {(info.eh_trial || trialExpirado) && (
        <BannerTrial
          diasRestantes={info.dias_restantes_trial}
          expirado={info.trial_expirado || !!trialExpirado}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu plano e acompanhe sua assinatura
          </p>
        </div>
        <Badge className={statusAtual.cor}>{statusAtual.texto}</Badge>
      </div>

      {/* Card: Resumo da assinatura */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Sua assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-3">
              {/* Plano e valor */}
              <div>
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className="text-lg font-semibold">{planoConfig.nome}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Valor mensal</p>
                  <p className="font-medium">
                    {planoConfig.preco_mensal === 0
                      ? "Grátis"
                      : formatarPreco(planoConfig.preco_mensal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {info.eh_trial ? "Expira em" : "Próxima cobrança"}
                  </p>
                  <p className="font-medium">
                    {info.eh_trial && info.trial_fim_em
                      ? formatarData(info.trial_fim_em)
                      : info.proxima_cobranca
                        ? formatarData(info.proxima_cobranca)
                        : "—"}
                  </p>
                </div>
              </div>
            </div>

            {info.stripe_customer_id && ehAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortal}
                disabled={carregando}
                className="shrink-0"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Gerenciar assinatura
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerta de pagamento pendente */}
      {info.plano_status === "past_due" && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-sm text-warning">
            Seu último pagamento falhou. Atualize seu método de pagamento para
            evitar a suspensão da conta.
          </p>
        </div>
      )}

      {/* Card: Histórico de pagamentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            Histórico de pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {info.faturas_recentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma cobrança realizada ainda.
            </p>
          ) : (
            <div className="space-y-1">
              {info.faturas_recentes.map((fatura) => {
                const s = statusFatura[fatura.status] || statusFatura.unknown
                return (
                  <div
                    key={fatura.id}
                    className="flex items-center justify-between py-2.5 border-b last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground w-32">
                        {formatarData(fatura.data)}
                      </p>
                      <span className={`text-xs font-medium ${s.cor}`}>
                        {s.texto}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium">
                        {formatarPreco(fatura.valor)}
                      </p>
                      {fatura.url && (
                        <a
                          href={fatura.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de planos */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Planos disponíveis</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {Object.values(PLANOS).map((plano) => (
            <CardPlano
              key={plano.id}
              config={plano}
              planoAtual={info.plano}
              carregando={carregando}
              onAssinar={handleAssinar}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
