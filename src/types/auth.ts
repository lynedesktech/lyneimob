import { z } from "zod"

export const schemaLogin = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export const schemaCadastro = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  nomeOrganizacao: z.string().min(2, "Nome da imobiliária deve ter pelo menos 2 caracteres"),
})

export const schemaEsqueciSenha = z.object({
  email: z.string().email("Email inválido"),
})

export const schemaRedefinirSenha = z.object({
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string().min(6, "Confirme sua senha"),
}).refine((dados) => dados.senha === dados.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
})

