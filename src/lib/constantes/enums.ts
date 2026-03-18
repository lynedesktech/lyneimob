// ============================================================
// Fonte única de verdade para todos os enums do sistema
// Usado tanto para derivar tipos TypeScript (database.ts)
// quanto para validação Zod (z.enum()) nos schemas
// ============================================================

// --- Imóveis ---

export const TIPOS_IMOVEL = [
  "apartamento", "casa", "terreno", "sala_comercial", "galpao",
  "cobertura", "kitnet", "fazenda", "sitio", "loja", "outro",
] as const

export const FINALIDADES_IMOVEL = ["venda", "aluguel", "venda_e_aluguel"] as const

export const STATUS_IMOVEL = [
  "disponivel", "reservado", "vendido", "alugado", "inativo",
] as const

// --- Clientes ---

export const TIPOS_CLIENTE = [
  "comprador", "vendedor", "locatario", "proprietario",
] as const

export const ORIGENS_CLIENTE = [
  "indicacao", "portal", "site", "whatsapp", "outro",
] as const

export const STATUS_CLIENTE = [
  "ativo", "inativo", "negociando", "fechado",
] as const

export const TIPOS_INTERACAO = [
  "ligacao", "email", "visita", "whatsapp", "reuniao", "outro",
] as const

// --- Negócios ---

export const TIPOS_NEGOCIO = ["venda", "aluguel"] as const

export const STATUS_NEGOCIO = ["aberto", "ganho", "perdido"] as const

// --- Atividades ---

export const STATUS_ATIVIDADE = ["pendente", "concluida", "cancelada"] as const

export const PRIORIDADES_ATIVIDADE = ["baixa", "media", "alta"] as const

// --- Loteamentos ---

export const STATUS_LOTEAMENTO = ["lancamento", "em_vendas", "esgotado"] as const

export const STATUS_LOTE = ["disponivel", "reservado", "vendido"] as const
