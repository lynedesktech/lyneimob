"use server"

import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { schemaLogin, schemaCadastro, schemaEsqueciSenha, schemaRedefinirSenha } from "@/types/auth"
import type { EstadoFormulario } from "@/types/formulario"

export async function login(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaLogin.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  })

  if (!dados.success) {
    const email = formData.get("email") as string | null
    return { erro: dados.error.issues[0].message, email: email ?? undefined }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.auth.signInWithPassword({
    email: dados.data.email,
    password: dados.data.senha,
  })

  if (error) {
    // Verificar se o email não confirmado é o problema
    if (error.message?.includes("Email not confirmed")) {
      return { erro: "Seu email ainda não foi confirmado. Verifique sua caixa de entrada.", email: dados.data.email }
    }

    // Usar admin client pra verificar se o email existe
    const admin = criarClienteAdmin()
    const { data: usuario } = await admin
      .from("usuarios")
      .select("id")
      .eq("email", dados.data.email)
      .maybeSingle()

    if (!usuario) {
      return { erro: "Nenhuma conta encontrada com este email.", email: dados.data.email }
    }

    return { erro: "Senha incorreta. Tente novamente ou clique em Esqueci minha senha.", email: dados.data.email }
  }

  redirect("/")
}

export async function cadastrar(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaCadastro.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    nomeOrganizacao: formData.get("nomeOrganizacao"),
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.auth.signUp({
    email: dados.data.email,
    password: dados.data.senha,
    options: {
      data: {
        nome: dados.data.nome,
        nome_organizacao: dados.data.nomeOrganizacao,
      },
    },
  })

  if (error) {
    if (error.message.includes("already registered")) {
      return { erro: "Este email já está cadastrado" }
    }
    return { erro: "Erro ao criar conta. Tente novamente." }
  }

  redirect("/")
}

export async function recuperarSenha(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaEsqueciSenha.safeParse({
    email: formData.get("email"),
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.auth.resetPasswordForEmail(dados.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (error) {
    return { erro: "Erro ao enviar email de recuperação" }
  }

  return { sucesso: "Email de recuperação enviado! Verifique sua caixa de entrada." }
}

export async function redefinirSenha(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const dados = schemaRedefinirSenha.safeParse({
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  })

  if (!dados.success) {
    return { erro: dados.error.issues[0].message }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.auth.updateUser({
    password: dados.data.senha,
  })

  if (error) {
    return { erro: "Erro ao redefinir senha. Tente solicitar um novo link de recuperação." }
  }

  await supabase.auth.signOut()
  redirect("/login?senha-redefinida=true")
}

export async function sair() {
  const supabase = await criarClienteServer()
  await supabase.auth.signOut()
  redirect("/login")
}
