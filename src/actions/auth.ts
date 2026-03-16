"use server"

import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { schemaLogin, schemaCadastro, schemaEsqueciSenha } from "@/types/auth"
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
    return { erro: dados.error.issues[0].message }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase.auth.signInWithPassword({
    email: dados.data.email,
    password: dados.data.senha,
  })

  if (error) {
    return { erro: "Email ou senha incorretos" }
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

export async function sair() {
  const supabase = await criarClienteServer()
  await supabase.auth.signOut()
  redirect("/login")
}
