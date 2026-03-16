"use server"

import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { verificarLimiteCorretores } from "@/lib/verificar-limites"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Validar convite (buscar dados publicos pelo token)
// ============================================================

export async function validarConvite(token: string) {
  const supabaseAdmin = criarClienteAdmin()

  const { data: convite, error } = await supabaseAdmin
    .from("convites")
    .select("id, email, cargo, status, expires_at, organizacao_id, organizacoes:organizacao_id(nome)")
    .eq("token", token)
    .single()

  if (error || !convite) {
    return { erro: "Convite nao encontrado." }
  }

  if (convite.status !== "pendente") {
    return { erro: "Este convite ja foi utilizado ou revogado." }
  }

  if (new Date(convite.expires_at) < new Date()) {
    return { erro: "Este convite expirou." }
  }

  return {
    dados: {
      email: convite.email,
      cargo: convite.cargo,
      organizacao_nome: (convite.organizacoes as unknown as { nome: string } | null)?.nome ?? "Organizacao",
    },
  }
}

// ============================================================
// Cadastrar via convite (novo usuario)
// ============================================================

export async function cadastrarViaConvite(
  token: string,
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const nome = formData.get("nome") as string
  const email = formData.get("email") as string
  const senha = formData.get("senha") as string

  if (!nome || !email || !senha) {
    return { erro: "Preencha todos os campos." }
  }

  if (senha.length < 6) {
    return { erro: "A senha deve ter no minimo 6 caracteres." }
  }

  // Validar convite
  const validacao = await validarConvite(token)
  if (validacao.erro) {
    return { erro: validacao.erro }
  }

  // Verificar que o email do formulario bate com o email do convite
  if (email.toLowerCase() !== validacao.dados!.email.toLowerCase()) {
    return { erro: "O email informado nao corresponde ao email do convite." }
  }

  // Verificar limite de membros da organizacao antes de criar conta
  const supabaseAdmin = criarClienteAdmin()
  const { data: conviteParaLimite } = await supabaseAdmin
    .from("convites")
    .select("organizacao_id")
    .eq("token", token)
    .eq("status", "pendente")
    .single()

  if (conviteParaLimite) {
    const limite = await verificarLimiteCorretores(conviteParaLimite.organizacao_id)
    if (!limite.permitido) {
      return { erro: limite.mensagem }
    }
  }

  // Criar usuario via Supabase Auth
  // O trigger no banco vai detectar o convite pendente e associar a org correta
  const supabase = await criarClienteServer()

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
      },
    },
  })

  if (error) {
    if (error.message.includes("already registered")) {
      return { erro: "Este email ja esta cadastrado. Faca login para aceitar o convite." }
    }
    return { erro: "Erro ao criar conta. Tente novamente." }
  }

  redirect("/")
}

// ============================================================
// Aceitar convite (usuario ja logado)
// ============================================================

export async function aceitarConviteLogado(token: string) {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { erro: "Voce precisa estar logado." }
  }

  // Validar convite
  const supabaseAdmin = criarClienteAdmin()

  const { data: convite } = await supabaseAdmin
    .from("convites")
    .select("*")
    .eq("token", token)
    .eq("status", "pendente")
    .single()

  if (!convite) {
    return { erro: "Convite nao encontrado ou ja utilizado." }
  }

  if (new Date(convite.expires_at) < new Date()) {
    return { erro: "Este convite expirou." }
  }

  // Verificar email
  if (user.email?.toLowerCase() !== convite.email.toLowerCase()) {
    return { erro: "Este convite e para outro email." }
  }

  // Verificar se ja esta na org
  const { data: jaExiste } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("id", user.id)
    .eq("organizacao_id", convite.organizacao_id)
    .single()

  if (jaExiste) {
    // Marcar convite como aceito
    await supabaseAdmin
      .from("convites")
      .update({ status: "aceito" })
      .eq("id", convite.id)

    return { sucesso: "Voce ja faz parte desta organizacao!" }
  }

  // Verificar limite de membros antes de mover
  const limite = await verificarLimiteCorretores(convite.organizacao_id)
  if (!limite.permitido) {
    return { erro: limite.mensagem }
  }

  // Mover usuario para a nova org
  const { error: erroUpdate } = await supabaseAdmin
    .from("usuarios")
    .update({
      organizacao_id: convite.organizacao_id,
      cargo: convite.cargo,
    })
    .eq("id", user.id)

  if (erroUpdate) {
    return { erro: "Erro ao aceitar convite." }
  }

  // Marcar convite como aceito
  await supabaseAdmin
    .from("convites")
    .update({ status: "aceito" })
    .eq("id", convite.id)

  return { sucesso: "Convite aceito! Voce agora faz parte da organizacao." }
}
