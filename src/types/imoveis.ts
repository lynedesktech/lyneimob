import { z } from "zod"

// ============================================================
// Schema de criação de imóvel
// ============================================================
export const schemaCriarImovel = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  tipo: z.enum(
    [
      "apartamento",
      "casa",
      "terreno",
      "sala_comercial",
      "galpao",
      "cobertura",
      "kitnet",
      "fazenda",
      "sitio",
      "loja",
      "outro",
    ],
    { message: "Selecione o tipo do imóvel" }
  ),
  finalidade: z.enum(["venda", "aluguel", "venda_e_aluguel"], {
    message: "Selecione a finalidade",
  }),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().length(2, "Use a sigla do estado (ex: SP)"),
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
})

// ============================================================
// Schema de atualização (inclui id e status)
// ============================================================
export const schemaAtualizarImovel = schemaCriarImovel.extend({
  id: z.string().uuid(),
  status: z
    .enum(["disponivel", "reservado", "vendido", "alugado", "inativo"])
    .optional(),
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
  pagina: z.coerce.number().default(1),
  por_pagina: z.coerce.number().default(12),
})

export type CriarImovelInput = z.infer<typeof schemaCriarImovel>
export type AtualizarImovelInput = z.infer<typeof schemaAtualizarImovel>
export type FiltrosImoveisInput = z.infer<typeof schemaFiltrosImoveis>
