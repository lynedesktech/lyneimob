import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { PaginaPlanos } from "@/components/planos/pagina-planos"
import type { InfoAssinatura, TipoPlano, StatusPlano, LimitesPlano } from "@/types/billing"

export default async function PlanosPage() {
  const supabase = await criarClienteServer()

  // Buscar usuário logado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar dados do usuário
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  if (!usuario) {
    redirect("/login")
  }

  // Buscar dados da organização
  const { data: org } = await supabase
    .from("organizacoes")
    .select(
      "plano, plano_status, limites, trial_fim_em, stripe_customer_id, stripe_subscription_id"
    )
    .eq("id", usuario.organizacao_id)
    .single()

  if (!org) {
    redirect("/login")
  }

  const ehTrial = org.plano === "trial"
  const trialFim = org.trial_fim_em ? new Date(org.trial_fim_em) : null
  const agora = new Date()

  let diasRestantes: number | null = null
  let trialExpirado = false

  if (ehTrial && trialFim) {
    const diff = trialFim.getTime() - agora.getTime()
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    trialExpirado = diff <= 0
  }

  // Buscar contagens reais de uso
  const [corretoresRes, imoveisRes, conversasRes] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", usuario.organizacao_id)
      .eq("ativo", true),
    supabase
      .from("imoveis")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", usuario.organizacao_id)
      .neq("status", "inativo"),
    supabase
      .from("eventos_billing")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", usuario.organizacao_id)
      .eq("tipo_evento", "conversa_ia")
      .gte("created_at", new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()),
  ])

  const info: InfoAssinatura = {
    plano: org.plano as TipoPlano,
    plano_status: org.plano_status as StatusPlano,
    limites: org.limites as LimitesPlano,
    trial_fim_em: org.trial_fim_em,
    stripe_customer_id: org.stripe_customer_id,
    stripe_subscription_id: org.stripe_subscription_id,
    eh_trial: ehTrial,
    trial_expirado: trialExpirado,
    dias_restantes_trial: diasRestantes,
    uso_corretores: corretoresRes.count ?? 0,
    uso_imoveis: imoveisRes.count ?? 0,
    uso_conversas_ia: conversasRes.count ?? 0,
  }

  return <PaginaPlanos info={info} ehAdmin={usuario.cargo === "admin"} />
}
