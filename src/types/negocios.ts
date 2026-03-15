import { z } from "zod"

// ============================================================
// Schema de criação de negócio
// ============================================================
export const schemaCriarNegocio = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  cliente_id: z.string().uuid("Selecione um cliente"),
  imovel_id: z.string().uuid("Selecione um imóvel").optional().or(z.literal("")),
  etapa_id: z.string().uuid("Selecione uma etapa"),
  valor: z.coerce.number().positive("Valor deve ser positivo").optional(),
  tipo: z.enum(["venda", "aluguel"], { message: "Selecione o tipo" }),
  previsao_fechamento: z.string().optional(),
  observacoes: z.string().optional(),
})

// ============================================================
// Schema de atualização (inclui id e status)
// ============================================================
export const schemaAtualizarNegocio = schemaCriarNegocio.extend({
  id: z.string().uuid(),
  status: z.enum(["aberto", "ganho", "perdido"]).optional(),
})

// ============================================================
// Schema para mover negócio no kanban
// ============================================================
export const schemaMoverNegocio = z.object({
  negocio_id: z.string().uuid(),
  etapa_id: z.string().uuid(),
  posicao: z.number().int().min(0),
})

// ============================================================
// Schema para ganhar negócio
// ============================================================
export const schemaGanharNegocio = z.object({
  id: z.string().uuid(),
  valor: z.coerce.number().positive("Valor final é obrigatório"),
})

// ============================================================
// Schema para perder negócio
// ============================================================
export const schemaPerderNegocio = z.object({
  id: z.string().uuid(),
  motivo_perda: z.string().min(3, "Informe o motivo da perda"),
})

// ============================================================
// Schema de filtros para pipeline
// ============================================================
export const schemaFiltrosNegocios = z.object({
  corretor_id: z.string().optional(),
  tipo: z.string().optional(),
  valor_min: z.coerce.number().optional(),
  valor_max: z.coerce.number().optional(),
  status: z.string().optional(),
})

export type CriarNegocioInput = z.infer<typeof schemaCriarNegocio>
export type AtualizarNegocioInput = z.infer<typeof schemaAtualizarNegocio>
export type MoverNegocioInput = z.infer<typeof schemaMoverNegocio>
export type GanharNegocioInput = z.infer<typeof schemaGanharNegocio>
export type PerderNegocioInput = z.infer<typeof schemaPerderNegocio>
export type FiltrosNegociosInput = z.infer<typeof schemaFiltrosNegocios>
