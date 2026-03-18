import { z } from "zod"
import { TIPOS_IMOVEL, FINALIDADES_IMOVEL, STATUS_IMOVEL } from "@/lib/constantes/enums"

// ============================================================
// Siglas válidas dos estados brasileiros
// ============================================================
export const SIGLAS_ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const

export type SiglaEstado = (typeof SIGLAS_ESTADOS_BR)[number]

// ============================================================
// Schema de criação de imóvel
// ============================================================
export const schemaCriarImovel = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  tipo: z.enum(TIPOS_IMOVEL, { message: "Selecione o tipo do imóvel" }),
  finalidade: z.enum(FINALIDADES_IMOVEL, { message: "Selecione a finalidade" }),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().length(2, "Use a sigla do estado (ex: SP)").transform(v => v.toUpperCase()).refine(
    (v) => (SIGLAS_ESTADOS_BR as readonly string[]).includes(v),
    "Sigla de estado inválida"
  ),
  preco_venda: z.coerce.number().positive("Preço deve ser positivo").optional(),
  preco_aluguel: z.coerce
    .number()
    .positive("Preço deve ser positivo")
    .optional(),
  iptu: z.coerce.number().min(0, "IPTU não pode ser negativo").optional(),
  condominio: z.coerce
    .number()
    .min(0, "Condomínio não pode ser negativo")
    .optional(),
  area_total: z.coerce.number().positive("Área deve ser positiva").optional(),
  area_construida: z.coerce
    .number()
    .positive("Área deve ser positiva")
    .optional(),
  quartos: z.coerce.number().int().min(0).default(0),
  suites: z.coerce.number().int().min(0).default(0),
  banheiros: z.coerce.number().int().min(0).default(0),
  vagas_garagem: z.coerce.number().int().min(0).default(0),
  andares: z.coerce.number().int().positive().optional(),
  observacoes_internas: z.string().optional(),
  publicar_site: z.coerce.boolean().default(true),
  publicar_portais: z.coerce.boolean().default(true),
})

// ============================================================
// Schema de atualização (inclui id e status)
// ============================================================
export const schemaAtualizarImovel = schemaCriarImovel.extend({
  id: z.string().uuid(),
  status: z.enum(STATUS_IMOVEL).optional(),
})

// ============================================================
// Schema de filtros para listagem
// ============================================================
export const schemaFiltrosImoveis = z.object({
  busca: z.string().optional(),
  tipo: z.string().optional(),
  finalidade: z.string().optional(),
  status: z.string().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  preco_min: z.coerce.number().optional(),
  preco_max: z.coerce.number().optional(),
  quartos_min: z.coerce.number().optional(),
  canal: z.enum(["todos", "site", "portais", "nenhum"]).optional(),
  pagina: z.coerce.number().default(1),
  por_pagina: z.coerce.number().default(12),
})

export type CriarImovelInput = z.infer<typeof schemaCriarImovel>
export type AtualizarImovelInput = z.infer<typeof schemaAtualizarImovel>
export type FiltrosImoveisInput = z.infer<typeof schemaFiltrosImoveis>
