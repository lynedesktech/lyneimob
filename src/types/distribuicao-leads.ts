import { z } from "zod"

// ============================================================
// Tipos de distribuição de leads
// ============================================================

export type ModoDistribuicao = "manual" | "roleta" | "balanceamento"

export type ConfigDistribuicao = {
  modo: ModoDistribuicao
  corretores_participantes: string[]
  ultimo_corretor_index: number
}

// ============================================================
// Schema Zod para salvar configuração
// ============================================================

export const schemaSalvarConfigDistribuicao = z.object({
  modo: z.enum(["manual", "roleta", "balanceamento"]),
  corretores_participantes: z.array(z.string().uuid()).default([]),
})

// ============================================================
// Constantes para a UI
// ============================================================

export const MODOS_DISTRIBUICAO: {
  valor: ModoDistribuicao
  titulo: string
  descricao: string
}[] = [
  {
    valor: "manual",
    titulo: "Manual",
    descricao: "Quem processa o lead fica com ele. No WhatsApp, usa o corretor padrão.",
  },
  {
    valor: "roleta",
    titulo: "Roleta",
    descricao: "Distribui automaticamente em sequência entre os corretores participantes.",
  },
  {
    valor: "balanceamento",
    titulo: "Balanceamento",
    descricao: "Atribui ao corretor com menos negócios abertos no momento.",
  },
]

// ============================================================
// Tipo para corretor com carga (usado na UI)
// ============================================================

export type CorretorComCarga = {
  id: string
  nome: string
  cargo: string
  ativo: boolean
  negocios_abertos: number
  participa_distribuicao: boolean
}
