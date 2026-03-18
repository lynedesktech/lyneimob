import { z } from "zod"
import { SIGLAS_ESTADOS_BR } from "@/types/imoveis"
import { STATUS_LOTEAMENTO, STATUS_LOTE } from "@/lib/constantes/enums"

// ============================================================
// Tipos base (derivados dos enums centrais)
// ============================================================

export type StatusLoteamento = (typeof STATUS_LOTEAMENTO)[number]
export type StatusLote = (typeof STATUS_LOTE)[number]

// ============================================================
// Schemas Zod — Loteamentos
// ============================================================

export const schemaCriarLoteamento = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  status: z.enum(STATUS_LOTEAMENTO).default("em_vendas"),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1, "Cidade obrigatória"),
  estado: z
    .string()
    .length(2, "Estado deve ter 2 caracteres")
    .transform((v) => v.toUpperCase())
    .refine(
      (v) => (SIGLAS_ESTADOS_BR as readonly string[]).includes(v),
      "Estado inválido"
    ),
  publicar_site: z.coerce.boolean().default(true),
  observacoes_internas: z.string().optional(),
})

export const schemaAtualizarLoteamento = schemaCriarLoteamento.extend({
  id: z.string().uuid(),
})

// ============================================================
// Schemas Zod — Lotes
// ============================================================

export const schemaCriarLote = z.object({
  loteamento_id: z.string().uuid(),
  quadra: z.string().min(1, "Quadra obrigatória"),
  numero_lote: z.string().min(1, "Número do lote obrigatório"),
  unidade: z.string().min(1, "Unidade obrigatória"),
  status: z.enum(STATUS_LOTE).default("disponivel"),
  comprador: z.string().optional(),
  valor: z.coerce.number().min(0, "Valor deve ser positivo"),
  data_venda: z.string().optional(),
  area: z.coerce.number().positive("Área deve ser positiva").optional(),
  observacoes: z.string().optional(),
})

export const schemaAtualizarLote = schemaCriarLote.extend({
  id: z.string().uuid(),
})

// ============================================================
// Schemas Zod — Filtros
// ============================================================

export const schemaFiltrosLoteamentos = z.object({
  busca: z.string().optional(),
  status: z.enum(STATUS_LOTEAMENTO).optional(),
  cidade: z.string().optional(),
  pagina: z.coerce.number().int().positive().default(1),
  por_pagina: z.coerce.number().int().positive().default(12),
})

export const schemaFiltrosLotes = z.object({
  quadra: z.string().optional(),
  status: z.enum(STATUS_LOTE).optional(),
  busca: z.string().optional(),
})

// ============================================================
// Types inferidos
// ============================================================

export type CriarLoteamentoInput = z.infer<typeof schemaCriarLoteamento>
export type AtualizarLoteamentoInput = z.infer<typeof schemaAtualizarLoteamento>
export type CriarLoteInput = z.infer<typeof schemaCriarLote>
export type AtualizarLoteInput = z.infer<typeof schemaAtualizarLote>
export type FiltrosLoteamentosInput = z.infer<typeof schemaFiltrosLoteamentos>
export type FiltrosLotesInput = z.infer<typeof schemaFiltrosLotes>
