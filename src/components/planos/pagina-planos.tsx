"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CardPlano } from "@/components/planos/card-plano"
import { BannerTrial } from "@/components/planos/banner-trial"
import { criarSessaoCheckout, criarSessaoPortal } from "@/actions/billing"
import { PLANOS } from "@/types/billing"
import type { TipoPlano, InfoAssinatura } from "@/types/billing"

interface PaginaPlanosProps {
  info: InfoAssinatura
  ehAdmin: boolean
}

export function PaginaPlanos({ info, ehAdmin }: PaginaPlanosProps) {
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Mensagens de retorno do Stripe
  const sucesso = searchParams.get("sucesso")
  const cancelado = searchParams.get("cancelado")
  const trialExpirado = searchParams.get("trial_expirado")

  if (sucesso) {
    toast.success("Assinatura realizada com sucesso! Bem-vindo ao LyneImob.")
  }
  if (cancelado) {
    toast.info("Checkout cancelado. Você pode tentar novamente quando quiser.")
  }

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
          <p className="text-muted-foreground mt-1">
            Escolha o plano ideal para sua imobiliária
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={statusAtual.cor}>{statusAtual.texto}</Badge>

          {info.stripe_customer_id && ehAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePortal}
              disabled={carregando}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Gerenciar assinatura
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Plano atual */}
      {info.plano_status === "past_due" && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <p className="text-sm text-warning">
            Seu último pagamento falhou. Atualize seu método de pagamento para
            evitar a suspensão da conta.
          </p>
        </div>
      )}

      {/* Grid de planos */}
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

      {/* Info sobre limites atuais */}
      <div className="rounded-lg border bg-muted/30 p-6">
        <h3 className="font-semibold mb-3">Seu uso atual</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Corretores</p>
            <p className="text-lg font-medium">
              — / {info.limites.max_corretores}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Imóveis</p>
            <p className="text-lg font-medium">
              — / {info.limites.max_imoveis}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Conversas IA / mês</p>
            <p className="text-lg font-medium">
              — / {info.limites.max_conversas_ia_mes}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
