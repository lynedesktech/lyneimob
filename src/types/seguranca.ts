import { z } from "zod"

export const schemaTrocarSenha = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres")
      .regex(/[a-zA-Z]/, "A nova senha deve conter pelo menos 1 letra")
      .regex(/[0-9]/, "A nova senha deve conter pelo menos 1 número"),
    confirmarSenha: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((dados) => dados.novaSenha !== dados.senhaAtual, {
    message: "A nova senha não pode ser igual à atual",
    path: ["novaSenha"],
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  })

export type DadosTrocarSenha = z.infer<typeof schemaTrocarSenha>
