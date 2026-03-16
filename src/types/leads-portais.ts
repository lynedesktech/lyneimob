import { z } from "zod"

// ============================================================
// Schemas Zod
// ============================================================

export const schemaFiltrosLeads = z.object({
  portal: z.enum(["zap", "olx", "vivareal", "imovelweb", "site", "whatsapp", "outro"]).optional(),
  status: z.enum(["novo", "processado", "descartado", "erro"]).optional(),
  busca: z.string().optional(),
  pagina: z.number().optional(),
  por_pagina: z.number().optional(),
})

export type FiltrosLeadsInput = z.infer<typeof schemaFiltrosLeads>

// ============================================================
// Tipo do payload normalizado (saída do normalizador)
// ============================================================

export type LeadNormalizado = {
  portal: "zap" | "olx" | "vivareal" | "imovelweb" | "site" | "whatsapp" | "outro"
  nome: string | null
  email: string | null
  telefone: string | null
  mensagem: string | null
  imovel_codigo: string | null
}

// ============================================================
// Schema do formulário de contato do site público
// ============================================================

export const schemaContatoSite = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional().or(z.literal("")),
  mensagem: z.string().min(5, "Mensagem deve ter pelo menos 5 caracteres"),
  organizacao_slug: z.string(),
  imovel_codigo: z.string().optional().or(z.literal("")),
}).refine(
  (dados) => (dados.email && dados.email !== "") || (dados.telefone && dados.telefone !== ""),
  { message: "Informe pelo menos um email ou telefone para contato", path: ["email"] }
)

export type ContatoSiteInput = z.infer<typeof schemaContatoSite>
