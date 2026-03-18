import { z } from "zod"
import {
  TIPOS_CLIENTE,
  ORIGENS_CLIENTE,
  STATUS_CLIENTE,
  TIPOS_IMOVEL,
  FINALIDADES_IMOVEL,
  TIPOS_INTERACAO,
} from "@/lib/constantes/enums"

// ============================================================
// Schema de criação de cliente
// ============================================================
export const schemaCriarCliente = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  tipo: z.enum(TIPOS_CLIENTE, { message: "Selecione o tipo do cliente" }),
  origem: z.enum(ORIGENS_CLIENTE),
  observacoes: z.string().optional(),
})

// ============================================================
// Schema de atualização (inclui id e status)
// ============================================================
export const schemaAtualizarCliente = schemaCriarCliente.extend({
  id: z.string().uuid(),
  status: z.enum(STATUS_CLIENTE).optional(),
})

// ============================================================
// Schema de interesse do cliente
// ============================================================
export const schemaCriarInteresse = z.object({
  cliente_id: z.string().uuid(),
  tipo_imovel: z.enum(TIPOS_IMOVEL).optional(),
  finalidade: z.enum(FINALIDADES_IMOVEL).optional(),
  bairros_interesse: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, "Use a sigla do estado (ex: SP)").optional().or(z.literal("")),
  preco_min: z.coerce.number().positive("Preço deve ser positivo").optional(),
  preco_max: z.coerce.number().positive("Preço deve ser positivo").optional(),
  quartos_min: z.coerce.number().int().min(0).optional(),
  area_min: z.coerce.number().positive("Área deve ser positiva").optional(),
  observacoes: z.string().optional(),
})

export const schemaAtualizarInteresse = schemaCriarInteresse.extend({
  id: z.string().uuid(),
})

// ============================================================
// Schema de interação
// ============================================================
export const schemaCriarInteracao = z.object({
  cliente_id: z.string().uuid(),
  tipo: z.enum(TIPOS_INTERACAO, { message: "Selecione o tipo de interação" }),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  data: z.string().optional(),
})

// ============================================================
// Schema de filtros para listagem
// ============================================================
export const schemaFiltrosClientes = z.object({
  busca: z.string().optional(),
  tipo: z.string().optional(),
  origem: z.string().optional(),
  status: z.string().optional(),
  pagina: z.coerce.number().default(1),
  por_pagina: z.coerce.number().default(12),
})

export type CriarClienteInput = z.infer<typeof schemaCriarCliente>
export type AtualizarClienteInput = z.infer<typeof schemaAtualizarCliente>
export type CriarInteresseInput = z.infer<typeof schemaCriarInteresse>
export type AtualizarInteresseInput = z.infer<typeof schemaAtualizarInteresse>
export type CriarInteracaoInput = z.infer<typeof schemaCriarInteracao>
export type FiltrosClientesInput = z.infer<typeof schemaFiltrosClientes>
