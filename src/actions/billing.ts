"use server"

import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteStripe } from "@/lib/stripe"
import { verificarPermissao } from "@/lib/permissoes"
import { PLANOS, obterLimitesPorPlano } from "@/types/billing"
import type { TipoPlano, InfoAssinatura } from "@/types/billing"

// ============================================================
// Helpers
// ============================================================

async function buscarUsuarioLogado() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  return usuario
}

async function buscarOrganizacao(organizacaoId: string) {
  const supabase = await criarClienteServer()

  const { data } = await supabase
    .from("organizacoes")
    .select(
      "id, plano, plano_status, limites, trial_fim_em, stripe_customer_id, stripe_subscription_id, email, nome"
    )
    .eq("id", organizacaoId)
    .single()

  return data
}

// ============================================================
// Criar sessão de checkout (redireciona para o Stripe)
// ============================================================

export async function criarSessaoCheckout(plano: TipoPlano) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_plano")
  if (permissao.erro) {
    return permissao
  }

  if (plano === "trial") {
    return { erro: "O plano trial não pode ser assinado." }
  }

  const configPlano = PLANOS[plano]
  if (!configPlano.stripe_price_id) {
    return { erro: "Plano ainda não configurado no Stripe. Configure o STRIPE_PRICE_ID correspondente." }
  }

  const org = await buscarOrganizacao(usuario.organizacao_id)
  if (!org) {
    return { erro: "Organização não encontrada." }
  }

  const stripe = criarClienteStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  try {
    const sessao = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: configPlano.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        organizacao_id: org.id,
        plano: plano,
      },
      success_url: `${appUrl}/planos?sucesso=true`,
      cancel_url: `${appUrl}/planos?cancelado=true`,
      // Se já tem customer no Stripe, reutilizar
      ...(org.stripe_customer_id
        ? { customer: org.stripe_customer_id }
        : { customer_email: org.email || undefined }),
      subscription_data: {
        metadata: {
          organizacao_id: org.id,
          plano: plano,
        },
      },
    })

    if (sessao.url) {
      redirect(sessao.url)
    }

    return { erro: "Não foi possível criar a sessão de checkout." }
  } catch (erro) {
    // redirect() do Next.js lança um erro especial — deixar propagar
    if (erro instanceof Error && erro.message === "NEXT_REDIRECT") {
      throw erro
    }
    console.error("[Billing] Erro ao criar sessão de checkout:", erro instanceof Error ? erro.message : erro)
    return { erro: "Erro ao iniciar o pagamento. Tente novamente." }
  }
}

// ============================================================
// Criar sessão do Customer Portal (gerenciar assinatura)
// ============================================================

export async function criarSessaoPortal() {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_plano")
  if (permissao.erro) {
    return permissao
  }

  const org = await buscarOrganizacao(usuario.organizacao_id)
  if (!org) {
    return { erro: "Organização não encontrada." }
  }

  if (!org.stripe_customer_id) {
    return { erro: "Nenhuma assinatura encontrada. Assine um plano primeiro." }
  }

  const stripe = criarClienteStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  try {
    const sessao = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/planos`,
    })

    if (sessao.url) {
      redirect(sessao.url)
    }

    return { erro: "Não foi possível abrir o portal de assinatura." }
  } catch (erro) {
    if (erro instanceof Error && erro.message === "NEXT_REDIRECT") {
      throw erro
    }
    console.error("[Billing] Erro ao criar sessão do portal:", erro instanceof Error ? erro.message : erro)
    return { erro: "Erro ao abrir o portal. Tente novamente." }
  }
}

// ============================================================
// Buscar status da assinatura
// ============================================================

export async function buscarStatusAssinatura(): Promise<InfoAssinatura | null> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return null

  const org = await buscarOrganizacao(usuario.organizacao_id)
  if (!org) return null

  const ehTrial = org.plano === "trial"
  const agora = new Date()
  const trialFim = org.trial_fim_em ? new Date(org.trial_fim_em) : null

  let diasRestantes: number | null = null
  let trialExpirado = false

  if (ehTrial && trialFim) {
    const diff = trialFim.getTime() - agora.getTime()
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    trialExpirado = diff <= 0
  }

  // Buscar contagens reais de uso
  const supabase = await criarClienteServer()
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

  return {
    plano: org.plano as TipoPlano,
    plano_status: org.plano_status as InfoAssinatura["plano_status"],
    limites: org.limites as InfoAssinatura["limites"],
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
}
