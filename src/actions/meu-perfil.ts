"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import { schemaAtualizarPerfil } from "@/types/meu-perfil"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Buscar dados do perfil do usuário logado
// ============================================================

export async function buscarMeuPerfil() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { erro: "Você precisa estar logado." }
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, telefone, cargo, avatar_url, creci, created_at")
    .eq("id", user.id)
    .single()

  if (error || !data) {
    return { erro: "Erro ao buscar seus dados." }
  }

  return { dados: data }
}

// ============================================================
// Atualizar perfil do usuário logado
// ============================================================

export async function atualizarMeuPerfil(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { erro: "Você precisa estar logado." }
  }

  const dadosBrutos = {
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    creci: formData.get("creci"),
  }

  const validacao = schemaAtualizarPerfil.safeParse(dadosBrutos)

  if (!validacao.success) {
    return { erro: validacao.error.issues[0].message }
  }

  const { error } = await supabase
    .from("usuarios")
    .update({
      nome: validacao.data.nome,
      telefone: validacao.data.telefone || null,
      creci: validacao.data.creci || null,
    })
    .eq("id", user.id)

  if (error) {
    return { erro: "Erro ao atualizar seus dados." }
  }

  return { sucesso: "Dados atualizados com sucesso!" }
}
