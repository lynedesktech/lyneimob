"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { TipoPlano, StatusPlano, LimitesPlano } from "@/types/billing"

type DadosPlano = {
  plano: TipoPlano
  plano_status: StatusPlano
  limites: LimitesPlano
  trial_fim_em: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export function usePlano() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<DadosPlano | null>({
    queryKey: ["plano"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizacoes")
        .select(
          "plano, plano_status, limites, trial_fim_em, stripe_customer_id, stripe_subscription_id"
        )
        .single()

      if (error) throw error
      return data as DadosPlano
    },
  })

  const ehTrial = data?.plano === "trial"
  const trialFim = data?.trial_fim_em ? new Date(data.trial_fim_em) : null
  const agora = new Date()

  let diasRestantesTrial: number | null = null
  let trialExpirado = false

  if (ehTrial && trialFim) {
    const diff = trialFim.getTime() - agora.getTime()
    diasRestantesTrial = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    trialExpirado = diff <= 0
  }

  return {
    plano: data?.plano ?? "trial",
    planoStatus: data?.plano_status ?? "trialing",
    limites: data?.limites ?? { max_corretores: 2, max_imoveis: 50, max_conversas_ia_mes: 30 },
    trialFimEm: data?.trial_fim_em ?? null,
    ehTrial,
    trialExpirado,
    diasRestantesTrial,
    temAssinatura: !!data?.stripe_subscription_id,
    temCustomer: !!data?.stripe_customer_id,
    carregando: isLoading,
    erro: error,
  }
}
