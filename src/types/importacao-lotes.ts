import { z } from "zod"

// ============================================================
// Schema para validação de linha importada de CSV
// ============================================================

export const schemaLinhaImportacaoLote = z.object({
  quadra: z.string().min(1, "Quadra obrigatória"),
  numero_lote: z.string().min(1, "Número do lote obrigatório"),
  unidade: z.string().optional(),
  comprador: z
    .string()
    .optional()
    .transform((v) => (v === "0" ? undefined : v)),
  valor: z.coerce.number().min(0, "Valor deve ser positivo"),
  data_venda: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v === "0") return undefined
      // Converter DD/MM/YYYY pra YYYY-MM-DD
      const partes = v.split("/")
      if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`
      return v
    }),
  area: z.coerce.number().positive().optional(),
})

export type LinhaImportacaoLote = z.infer<typeof schemaLinhaImportacaoLote>

// ============================================================
// Tipos de resultado
// ============================================================

export type ResultadoImportacaoLotes = {
  criados: number
  erros: Array<{ linha: number; unidade: string; erro: string }>
}

// ============================================================
// Mapeamento de cabeçalhos CSV → campos do sistema
// Case-insensitive, com aliases em português
// ============================================================

export const MAPEAMENTO_COLUNAS_LOTES: Record<string, string> = {
  quadra: "quadra",
  lote: "numero_lote",
  numero_lote: "numero_lote",
  "número_lote": "numero_lote",
  "numero do lote": "numero_lote",
  unidade: "unidade",
  comprador: "comprador",
  nome: "comprador",
  valor: "valor",
  "valor venda": "valor",
  preco: "valor",
  "preço": "valor",
  "data venda": "data_venda",
  data_venda: "data_venda",
  "data da venda": "data_venda",
  area: "area",
  "área": "area",
  "area m2": "area",
  "área m²": "area",
}

// Campos obrigatórios para referência
export const CAMPOS_OBRIGATORIOS_LOTES = ["quadra", "numero_lote", "valor"]

// Colunas do modelo/template na ordem correta
export const COLUNAS_TEMPLATE_LOTES = [
  "quadra",
  "numero_lote",
  "unidade",
  "valor",
  "area",
  "comprador",
  "data_venda",
]
