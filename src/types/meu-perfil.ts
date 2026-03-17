import { z } from "zod"

// ============================================================
// Schema de atualização do perfil do usuário logado
// ============================================================
export const schemaAtualizarPerfil = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().optional().or(z.literal("")),
  creci: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
})

export type DadosAtualizarPerfil = z.infer<typeof schemaAtualizarPerfil>
