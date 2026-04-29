"use server"

import { createClient } from "@supabase/supabase-js"
import { criarClienteServer } from "@/lib/supabase/server"
import { schemaTrocarSenha, type DadosTrocarSenha } from "@/types/seguranca"
import type { EstadoFormulario } from "@/types/formulario"

export async function trocarSenha(dados: DadosTrocarSenha): Promise<EstadoFormulario> {
  const validacao = schemaTrocarSenha.safeParse(dados)
  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message }
  }
  const { senhaAtual, novaSenha } = validacao.data

  const supabase = await criarClienteServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { erro: "Você precisa estar logado." }
  }

  // Verifica a senha atual com um cliente isolado (sem persistir sessao)
  // para nao alterar os cookies da sessao corrente do usuario
  const verificador = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { error: erroReauth } = await verificador.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  })

  if (erroReauth) {
    return { erro: "Senha atual incorreta" }
  }

  const { error: erroUpdate } = await supabase.auth.updateUser({ password: novaSenha })

  if (erroUpdate) {
    return { erro: "Erro ao atualizar senha. Tente novamente." }
  }

  return { sucesso: "Senha alterada com sucesso!" }
}
