import Stripe from "stripe"

// ============================================================
// Cliente Stripe — singleton para uso em Server Actions e Webhooks
// ============================================================

let instanciaStripe: Stripe | null = null

export function criarClienteStripe(): Stripe {
  if (instanciaStripe) return instanciaStripe

  const chave = process.env.STRIPE_SECRET_KEY

  if (!chave) {
    throw new Error(
      "STRIPE_SECRET_KEY não configurada nas variáveis de ambiente"
    )
  }

  instanciaStripe = new Stripe(chave, {
    typescript: true,
  })

  return instanciaStripe
}
