import { z } from "zod"
import { PRIORIDADES_ATIVIDADE } from "@/lib/constantes/enums"

// ============================================================
// Schema de criação de atividade
// ============================================================
export const schemaCriarAtividade = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  tipo: z.string().min(1, "Selecione o tipo de atividade"),
  prioridade: z.enum(PRIORIDADES_ATIVIDADE),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  descricao: z.string().optional(),
  cliente_id: z.string().uuid("Selecione um cliente").optional().or(z.literal("")),
  negocio_id: z.string().uuid("Selecione um negócio").optional().or(z.literal("")),
  imovel_id: z.string().uuid("Selecione um imóvel").optional().or(z.literal("")),
})

// ============================================================
// Schema de atualização (inclui id)
// ============================================================
export const schemaAtualizarAtividade = schemaCriarAtividade.extend({
  id: z.string().uuid(),
})

// ============================================================
// Schema para marcar como concluída
// ============================================================
export const schemaMarcarConcluida = z.object({
  id: z.string().uuid(),
})

// ============================================================
// Schema para reagendar
// ============================================================
export const schemaReagendarAtividade = z.object({
  id: z.string().uuid(),
  data_vencimento: z.string().min(1, "Nova data é obrigatória"),
})

// ============================================================
// Schema de filtros
// ============================================================
export const schemaFiltrosAtividades = z.object({
  tipo: z.string().optional(),
  status: z.string().optional(),
  prioridade: z.string().optional(),
  responsavel_id: z.string().optional(),
  data_vencimento_inicio: z.string().optional(),
  data_vencimento_fim: z.string().optional(),
  pagina: z.number().int().min(1).default(1),
  por_pagina: z.number().int().min(1).default(20),
})

export type CriarAtividadeInput = z.infer<typeof schemaCriarAtividade>
export type AtualizarAtividadeInput = z.infer<typeof schemaAtualizarAtividade>
export type MarcarConcluidaInput = z.infer<typeof schemaMarcarConcluida>
export type ReagendarAtividadeInput = z.infer<typeof schemaReagendarAtividade>
export type FiltrosAtividadesInput = z.infer<typeof schemaFiltrosAtividades>
