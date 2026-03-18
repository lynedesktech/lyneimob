import { z } from "zod/v4"

// ============================================================
// Tipos e constantes do módulo de billing
// ============================================================

export type TipoPlano = "trial" | "crm_ia" | "crm_ia_sdr"

export type StatusPlano = "active" | "past_due" | "canceled" | "trialing"

export type LimitesPlano = {
  max_corretores: number
  max_imoveis: number
  max_loteamentos: number
  max_conversas_ia_mes: number
}

export type PlanoConfig = {
  id: TipoPlano
  nome: string
  descricao: string
  preco_mensal: number // em centavos (BRL)
  limites: LimitesPlano
  stripe_price_id: string | null
  funcionalidades: string[]
}

// ============================================================
// Constantes dos planos
// ============================================================

export const PLANOS: Record<TipoPlano, PlanoConfig> = {
  trial: {
    id: "trial",
    nome: "Essencial",
    descricao: "14 dias grátis para você testar tudo",
    preco_mensal: 0,
    limites: {
      max_corretores: 999999,
      max_imoveis: 999999,
      max_loteamentos: 1,
      max_conversas_ia_mes: 999999,
    },
    stripe_price_id: null,
    funcionalidades: [
      "Gestão completa (imóveis, clientes, negócios, atividades)",
      "IA em todos os módulos",
      "Site público personalizado",
      "Integração com portais",
      "14 dias de acesso completo",
    ],
  },
  crm_ia: {
    id: "crm_ia",
    nome: "Profissional",
    descricao: "Gestão completa com IA integrada em todos os módulos",
    preco_mensal: 19900, // R$ 199,00
    limites: {
      max_corretores: 999999,
      max_imoveis: 999999,
      max_loteamentos: 5,
      max_conversas_ia_mes: 999999,
    },
    stripe_price_id: process.env.STRIPE_PRICE_ID_CRM_IA || null,
    funcionalidades: [
      "Gestão completa (imóveis, clientes, negócios, atividades)",
      "IA em todos os módulos",
      "Site público personalizado",
      "Integração com portais",
      "Corretores, imóveis e atividades ilimitados",
    ],
  },
  crm_ia_sdr: {
    id: "crm_ia_sdr",
    nome: "Completo",
    descricao: "Tudo incluído + Agente SDR WhatsApp com IA",
    preco_mensal: 39900, // R$ 399,00
    limites: {
      max_corretores: 999999,
      max_imoveis: 999999,
      max_loteamentos: 20,
      max_conversas_ia_mes: 999999,
    },
    stripe_price_id: process.env.STRIPE_PRICE_ID_CRM_IA_SDR || null,
    funcionalidades: [
      "Tudo do plano Profissional",
      "Agente SDR WhatsApp com IA",
      "Qualificação automática de leads",
      "Atendimento 24/7 por WhatsApp",
      "Corretores, imóveis e atividades ilimitados",
    ],
  },
}

// ============================================================
// Módulos bloqueados por plano
// ============================================================

export const MODULOS_POR_PLANO: Record<string, TipoPlano[]> = {
  conversas: ["crm_ia_sdr"],
}

// ============================================================
// Tipos de retorno das Server Actions
// ============================================================

export type FaturaStripe = {
  id: string
  data: string
  valor: number      // em centavos
  status: string     // "paid" | "open" | "void" | "uncollectible"
  url: string | null
}

export type InfoAssinatura = {
  plano: TipoPlano
  plano_status: StatusPlano
  limites: LimitesPlano
  trial_fim_em: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  eh_trial: boolean
  trial_expirado: boolean
  dias_restantes_trial: number | null
  proxima_cobranca: string | null
  faturas_recentes: FaturaStripe[]
}

export type ResultadoCheckout = {
  url?: string
  erro?: string
}

export type ResultadoPortal = {
  url?: string
  erro?: string
}

export type ResultadoLimite = {
  permitido: boolean
  mensagem?: string
  limite_atual?: number
  limite_max?: number
}

// ============================================================
// Schemas Zod
// ============================================================

export const schemaCheckout = z.object({
  plano: z.enum(["crm_ia", "crm_ia_sdr"]),
})

// ============================================================
// Helpers
// ============================================================

export function obterLimitesPorPlano(plano: TipoPlano): LimitesPlano {
  return PLANOS[plano].limites
}

export { formatarPrecoCentavos as formatarPreco } from "@/lib/formatadores"

export function planoPermiteModulo(
  plano: TipoPlano,
  modulo: string
): boolean {
  const planosPermitidos = MODULOS_POR_PLANO[modulo]
  if (!planosPermitidos) return true // módulo não tem restrição
  return planosPermitidos.includes(plano)
}
