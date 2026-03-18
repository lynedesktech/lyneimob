import { z } from "zod"
import { SIGLAS_ESTADOS_BR } from "@/types/imoveis"
import { TIPOS_IMOVEL, FINALIDADES_IMOVEL } from "@/lib/constantes/enums"

// ============================================================
// Schema para validação de linha importada de CSV/Excel
// Aceita strings e faz coerção para os tipos corretos
// ============================================================

export const schemaLinhaImportacao = z.object({
  // Obrigatórios
  codigo: z.string().min(1, "Código obrigatório"),
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  tipo: z.enum(TIPOS_IMOVEL, { message: "Tipo inválido" }),
  finalidade: z.enum(FINALIDADES_IMOVEL, { message: "Finalidade inválida" }),
  cidade: z.string().min(1, "Cidade obrigatória"),
  estado: z
    .string()
    .min(2, "Estado obrigatório")
    .transform((v) => v.toUpperCase().trim())
    .refine(
      (v) => (SIGLAS_ESTADOS_BR as readonly string[]).includes(v),
      "Sigla de estado inválida"
    ),

  // Opcionais — texto
  descricao: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  observacoes_internas: z.string().optional(),

  // Opcionais — numéricos (coerção de string)
  preco_venda: z.coerce.number().positive("Preço deve ser positivo").optional(),
  preco_aluguel: z.coerce.number().positive("Preço deve ser positivo").optional(),
  iptu: z.coerce.number().min(0, "IPTU não pode ser negativo").optional(),
  condominio: z.coerce.number().min(0, "Condomínio não pode ser negativo").optional(),
  area_total: z.coerce.number().positive("Área deve ser positiva").optional(),
  area_construida: z.coerce.number().positive("Área deve ser positiva").optional(),
  quartos: z.coerce.number().int().min(0).default(0),
  suites: z.coerce.number().int().min(0).default(0),
  banheiros: z.coerce.number().int().min(0).default(0),
  vagas_garagem: z.coerce.number().int().min(0).default(0),
  andares: z.coerce.number().int().positive().optional(),
})

export type LinhaImportacao = z.infer<typeof schemaLinhaImportacao>

// ============================================================
// Tipos de resultado
// ============================================================

export type ResultadoValidacao = {
  linha: number
  dados: Record<string, string>
  valido: boolean
  erros: string[]
  dadosValidados?: LinhaImportacao
}

export type ResultadoImportacao = {
  criados: number
  erros: Array<{ linha: number; codigo: string; erro: string }>
}

// ============================================================
// Mapeamento de cabeçalhos CSV/Excel → campos do sistema
// Case-insensitive, com aliases em português
// ============================================================

export const MAPEAMENTO_COLUNAS: Record<string, string> = {
  // Identificação
  codigo: "codigo",
  código: "codigo",
  cod: "codigo",
  titulo: "titulo",
  título: "titulo",
  nome: "titulo",
  descricao: "descricao",
  descrição: "descricao",

  // Classificação
  tipo: "tipo",
  tipo_imovel: "tipo",
  tipo_imóvel: "tipo",
  finalidade: "finalidade",

  // Endereço
  cep: "cep",
  logradouro: "logradouro",
  endereco: "logradouro",
  endereço: "logradouro",
  rua: "logradouro",
  numero: "numero",
  número: "numero",
  num: "numero",
  complemento: "complemento",
  bairro: "bairro",
  cidade: "cidade",
  municipio: "cidade",
  município: "cidade",
  estado: "estado",
  uf: "estado",

  // Valores
  preco_venda: "preco_venda",
  preço_venda: "preco_venda",
  preco: "preco_venda",
  preço: "preco_venda",
  valor_venda: "preco_venda",
  valor: "preco_venda",
  preco_aluguel: "preco_aluguel",
  preço_aluguel: "preco_aluguel",
  valor_aluguel: "preco_aluguel",
  aluguel: "preco_aluguel",
  iptu: "iptu",
  condominio: "condominio",
  condomínio: "condominio",

  // Características
  area_total: "area_total",
  área_total: "area_total",
  area: "area_total",
  área: "area_total",
  area_construida: "area_construida",
  área_construída: "area_construida",
  quartos: "quartos",
  dormitorios: "quartos",
  dormitórios: "quartos",
  suites: "suites",
  suítes: "suites",
  banheiros: "banheiros",
  vagas_garagem: "vagas_garagem",
  vagas: "vagas_garagem",
  garagem: "vagas_garagem",
  andares: "andares",

  // Observações
  observacoes_internas: "observacoes_internas",
  observações_internas: "observacoes_internas",
  observacoes: "observacoes_internas",
  observações: "observacoes_internas",
  obs: "observacoes_internas",
}

// Campos obrigatórios para referência
export const CAMPOS_OBRIGATORIOS = ["codigo", "titulo", "tipo", "finalidade", "cidade", "estado"]

// Colunas do modelo/template na ordem correta
export const COLUNAS_TEMPLATE = [
  "codigo",
  "titulo",
  "tipo",
  "finalidade",
  "cidade",
  "estado",
  "bairro",
  "logradouro",
  "numero",
  "complemento",
  "cep",
  "preco_venda",
  "preco_aluguel",
  "iptu",
  "condominio",
  "area_total",
  "area_construida",
  "quartos",
  "suites",
  "banheiros",
  "vagas_garagem",
  "andares",
  "descricao",
  "observacoes_internas",
]
