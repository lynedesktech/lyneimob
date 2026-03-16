import { NextResponse } from "next/server"
import { criarClienteStripe } from "@/lib/stripe"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { obterLimitesPorPlano, PLANOS } from "@/types/billing"
import type { TipoPlano } from "@/types/billing"
import type Stripe from "stripe"

// ============================================================
// Webhook Stripe — recebe eventos de pagamento e assinatura
// ============================================================

export async function POST(request: Request) {
  const stripe = criarClienteStripe()
  const supabase = criarClienteAdmin()

  try {
    // Ler body como texto (necessário para verificação de assinatura)
    const body = await request.text()
    const assinatura = request.headers.get("stripe-signature")

    if (!assinatura) {
      return NextResponse.json(
        { erro: "Assinatura Stripe ausente" },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurada")
      return NextResponse.json(
        { erro: "Webhook secret não configurada" },
        { status: 500 }
      )
    }

    // Verificar assinatura do Stripe
    let evento: Stripe.Event
    try {
      evento = stripe.webhooks.constructEvent(body, assinatura, webhookSecret)
    } catch (erro) {
      console.error("[Stripe Webhook] Erro na verificação de assinatura:", erro instanceof Error ? erro.message : erro)
      return NextResponse.json(
        { erro: "Assinatura inválida" },
        { status: 400 }
      )
    }

    // Evitar processar evento duplicado
    const { data: eventoExistente } = await supabase
      .from("eventos_billing")
      .select("id")
      .eq("stripe_event_id", evento.id)
      .single()

    if (eventoExistente) {
      return NextResponse.json({ status: "ignorado", motivo: "duplicata" })
    }

    // Processar evento por tipo
    switch (evento.type) {
      case "checkout.session.completed":
        await processarCheckoutCompleto(supabase, stripe, evento)
        break

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await processarAssinaturaCriadaOuAtualizada(supabase, evento)
        break

      case "customer.subscription.deleted":
        await processarAssinaturaCancelada(supabase, evento)
        break

      case "invoice.payment_succeeded":
        await processarPagamentoSucesso(supabase, evento)
        break

      case "invoice.payment_failed":
        await processarPagamentoFalhou(supabase, evento)
        break

      default:
        // Evento não tratado — só logar
        break
    }

    // Salvar evento para auditoria (buscar org_id do metadata ou do customer)
    const organizacaoId = await extrairOrganizacaoId(supabase, evento)
    if (organizacaoId) {
      await supabase.from("eventos_billing").insert({
        organizacao_id: organizacaoId,
        tipo_evento: evento.type,
        stripe_event_id: evento.id,
        payload: evento.data.object as unknown as Record<string, unknown>,
      })
    }

    return NextResponse.json({ status: "ok", tipo: evento.type })
  } catch (erro) {
    console.error("[Stripe Webhook] Erro geral:", erro instanceof Error ? erro.message : erro)
    return NextResponse.json(
      { erro: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}

// ============================================================
// Handlers por tipo de evento
// ============================================================

async function processarCheckoutCompleto(
  supabase: ReturnType<typeof criarClienteAdmin>,
  stripe: ReturnType<typeof criarClienteStripe>,
  evento: Stripe.Event
) {
  const session = evento.data.object as Stripe.Checkout.Session

  const organizacaoId = session.metadata?.organizacao_id
  if (!organizacaoId) {
    console.error("[Stripe Webhook] checkout.session.completed sem organizacao_id no metadata")
    return
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id

  if (!customerId) {
    console.error("[Stripe Webhook] checkout.session.completed sem customer")
    return
  }

  // Associar stripe_customer_id à organização
  await supabase
    .from("organizacoes")
    .update({ stripe_customer_id: customerId })
    .eq("id", organizacaoId)

  // Se for subscription, buscar detalhes
  if (session.subscription) {
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const plano = identificarPlano(subscription)

    await supabase
      .from("organizacoes")
      .update({
        stripe_subscription_id: subscriptionId,
        plano: plano,
        plano_status: "active",
        limites: obterLimitesPorPlano(plano),
      })
      .eq("id", organizacaoId)
  }
}

async function processarAssinaturaCriadaOuAtualizada(
  supabase: ReturnType<typeof criarClienteAdmin>,
  evento: Stripe.Event
) {
  const subscription = evento.data.object as Stripe.Subscription

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id

  // Buscar organização pelo stripe_customer_id
  const { data: org } = await supabase
    .from("organizacoes")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) {
    console.error(
      `[Stripe Webhook] Organização não encontrada para customer ${customerId}`
    )
    return
  }

  const plano = identificarPlano(subscription)
  const status = mapearStatusAssinatura(subscription.status)

  await supabase
    .from("organizacoes")
    .update({
      stripe_subscription_id: subscription.id,
      plano: plano,
      plano_status: status,
      limites: obterLimitesPorPlano(plano),
    })
    .eq("id", org.id)
}

async function processarAssinaturaCancelada(
  supabase: ReturnType<typeof criarClienteAdmin>,
  evento: Stripe.Event
) {
  const subscription = evento.data.object as Stripe.Subscription

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id

  const { data: org } = await supabase
    .from("organizacoes")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) return

  // Voltar para trial com limites reduzidos
  await supabase
    .from("organizacoes")
    .update({
      plano: "trial",
      plano_status: "canceled",
      limites: obterLimitesPorPlano("trial"),
      stripe_subscription_id: null,
    })
    .eq("id", org.id)
}

async function processarPagamentoSucesso(
  supabase: ReturnType<typeof criarClienteAdmin>,
  evento: Stripe.Event
) {
  const invoice = evento.data.object as Stripe.Invoice

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id

  if (!customerId) return

  const { data: org } = await supabase
    .from("organizacoes")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) return

  // Resolver inadimplência — voltar para active
  await supabase
    .from("organizacoes")
    .update({ plano_status: "active" })
    .eq("id", org.id)
}

async function processarPagamentoFalhou(
  supabase: ReturnType<typeof criarClienteAdmin>,
  evento: Stripe.Event
) {
  const invoice = evento.data.object as Stripe.Invoice

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id

  if (!customerId) return

  const { data: org } = await supabase
    .from("organizacoes")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) return

  await supabase
    .from("organizacoes")
    .update({ plano_status: "past_due" })
    .eq("id", org.id)
}

// ============================================================
// Helpers
// ============================================================

function identificarPlano(subscription: Stripe.Subscription): TipoPlano {
  const priceId = subscription.items.data[0]?.price?.id

  if (priceId === process.env.STRIPE_PRICE_ID_CRM_IA_SDR) {
    return "crm_ia_sdr"
  }
  if (priceId === process.env.STRIPE_PRICE_ID_CRM_IA) {
    return "crm_ia"
  }

  // Fallback: tentar identificar pelo valor
  const valor = subscription.items.data[0]?.price?.unit_amount
  if (valor && valor >= PLANOS.crm_ia_sdr.preco_mensal) {
    return "crm_ia_sdr"
  }

  return "crm_ia"
}

function mapearStatusAssinatura(
  status: Stripe.Subscription.Status
): "active" | "past_due" | "canceled" | "trialing" {
  switch (status) {
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled"
    case "trialing":
      return "trialing"
    default:
      return "active"
  }
}

async function extrairOrganizacaoId(
  supabase: ReturnType<typeof criarClienteAdmin>,
  evento: Stripe.Event
): Promise<string | null> {
  const objeto = evento.data.object as unknown as Record<string, unknown>

  // Tentar metadata primeiro (checkout sessions)
  const metadata = objeto.metadata as Record<string, string> | undefined
  if (metadata?.organizacao_id) {
    return metadata.organizacao_id
  }

  // Tentar pelo customer_id
  const customerId =
    typeof objeto.customer === "string" ? objeto.customer : null

  if (customerId) {
    const { data: org } = await supabase
      .from("organizacoes")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single()

    return org?.id || null
  }

  return null
}
