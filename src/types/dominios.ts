import { z } from "zod"

// ============================================================
// Tipos do domínio customizado
// ============================================================

export type StatusDominio = "pendente" | "verificado" | "erro"

export type DominioCustomizado = {
  id: string
  organizacao_id: string
  dominio: string
  status: StatusDominio
  verificado_em: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Schema Zod para validação do domínio
// ============================================================

// Regex: domínio válido (sem protocolo, sem barra, sem porta)
// Aceita: www.exemplo.com.br, meusite.com, sub.dominio.com.br
const regexDominio = /^(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/

export const schemaDominio = z
  .string()
  .min(4, "Domínio muito curto")
  .max(253, "Domínio muito longo")
  .regex(regexDominio, "Formato de domínio inválido. Use algo como: www.seusite.com.br")
  .transform((val) => val.toLowerCase().trim())
