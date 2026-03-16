import type { LeadNormalizado } from "@/types/leads-portais"

// ============================================================
// Normalizador de leads dos portais imobiliários
// Cada portal envia um formato diferente — aqui padronizamos
// ============================================================

// ============================================================
// ZAP Imóveis / Grupo OLX
// ============================================================

function normalizarZap(payload: Record<string, unknown>): LeadNormalizado {
  const customer = payload.customer as Record<string, unknown> | undefined
  const listing = payload.listing as Record<string, unknown> | undefined

  return {
    portal: "zap",
    nome: (customer?.name as string) || null,
    email: (customer?.email as string) || null,
    telefone: (customer?.phone as string) || null,
    mensagem: (customer?.message as string) || null,
    imovel_codigo: (listing?.id as string) || null,
  }
}

// ============================================================
// OLX
// ============================================================

function normalizarOlx(payload: Record<string, unknown>): LeadNormalizado {
  // OLX usa formato similar ao ZAP (mesmo grupo)
  // mas pode ter variações nos nomes dos campos
  const customer = payload.customer as Record<string, unknown> | undefined
  const listing = payload.listing as Record<string, unknown> | undefined

  // Fallbacks para formato alternativo da OLX
  const lead = payload.lead as Record<string, unknown> | undefined

  return {
    portal: "olx",
    nome: (customer?.name as string) || (lead?.name as string) || (payload.name as string) || null,
    email: (customer?.email as string) || (lead?.email as string) || (payload.email as string) || null,
    telefone: (customer?.phone as string) || (lead?.phone as string) || (payload.phone as string) || null,
    mensagem: (customer?.message as string) || (lead?.message as string) || (payload.message as string) || null,
    imovel_codigo: (listing?.id as string) || (lead?.listing_id as string) || (payload.listing_id as string) || null,
  }
}

// ============================================================
// VivaReal
// ============================================================

function normalizarVivaReal(payload: Record<string, unknown>): LeadNormalizado {
  // VivaReal é do mesmo grupo OLX, formato muito similar ao ZAP
  const customer = payload.customer as Record<string, unknown> | undefined
  const listing = payload.listing as Record<string, unknown> | undefined

  return {
    portal: "vivareal",
    nome: (customer?.name as string) || null,
    email: (customer?.email as string) || null,
    telefone: (customer?.phone as string) || null,
    mensagem: (customer?.message as string) || null,
    imovel_codigo: (listing?.id as string) || null,
  }
}

// ============================================================
// Imovelweb
// ============================================================

function normalizarImovelweb(payload: Record<string, unknown>): LeadNormalizado {
  // Imovelweb (Grupo QuintoAndar) pode ter formato próprio
  const contact = payload.contact as Record<string, unknown> | undefined
  const property = payload.property as Record<string, unknown> | undefined

  return {
    portal: "imovelweb",
    nome: (contact?.name as string) || (payload.name as string) || null,
    email: (contact?.email as string) || (payload.email as string) || null,
    telefone: (contact?.phone as string) || (payload.phone as string) || null,
    mensagem: (contact?.message as string) || (payload.message as string) || null,
    imovel_codigo: (property?.id as string) || (property?.code as string) || (payload.property_id as string) || null,
  }
}

// ============================================================
// Formato genérico (site próprio, whatsapp, outro)
// ============================================================

function normalizarGenerico(
  payload: Record<string, unknown>,
  portal: LeadNormalizado["portal"]
): LeadNormalizado {
  return {
    portal,
    nome: (payload.nome as string) || (payload.name as string) || null,
    email: (payload.email as string) || null,
    telefone: (payload.telefone as string) || (payload.phone as string) || null,
    mensagem: (payload.mensagem as string) || (payload.message as string) || null,
    imovel_codigo: (payload.imovel_codigo as string) || (payload.listing_id as string) || (payload.property_id as string) || null,
  }
}

// ============================================================
// Função principal — detecta portal e normaliza
// ============================================================

export function normalizarLead(
  payload: Record<string, unknown>,
  portalExplicito?: string
): LeadNormalizado {
  // Detectar portal pelo campo do payload ou usar o explícito
  const portal = portalExplicito
    || (payload.leadOrigin as string)?.toLowerCase()
    || (payload.portal as string)?.toLowerCase()
    || (payload.source as string)?.toLowerCase()
    || "outro"

  switch (portal) {
    case "zap":
    case "zapimoveis":
      return normalizarZap(payload)

    case "olx":
      return normalizarOlx(payload)

    case "vivareal":
      return normalizarVivaReal(payload)

    case "imovelweb":
      return normalizarImovelweb(payload)

    case "site":
    case "whatsapp":
      return normalizarGenerico(payload, portal as LeadNormalizado["portal"])

    default:
      return normalizarGenerico(payload, "outro")
  }
}

// ============================================================
// Validação mínima — lead precisa ter ao menos 1 dado de contato
// ============================================================

export function leadTemDadosMinimos(lead: LeadNormalizado): boolean {
  return Boolean(lead.nome || lead.email || lead.telefone)
}
