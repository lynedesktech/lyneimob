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
    .select("id, nome, email, telefone, cargo, avatar_url, creci, bio, created_at")
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
    bio: formData.get("bio"),
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
      bio: validacao.data.bio || null,
    })
    .eq("id", user.id)

  if (error) {
    return { erro: "Erro ao atualizar seus dados." }
  }

  return { sucesso: "Dados atualizados com sucesso!" }
}

// ============================================================
// Atualizar foto de perfil do usuário logado
// ============================================================

export async function atualizarAvatarPerfil(
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

  const arquivo = formData.get("avatar") as File
  if (!arquivo || !arquivo.size) {
    return { erro: "Nenhuma imagem selecionada." }
  }

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"]
  if (!tiposPermitidos.includes(arquivo.type)) {
    return { erro: "Formato inválido. Use JPEG, PNG ou WebP." }
  }

  if (arquivo.size > 5 * 1024 * 1024) {
    return { erro: "Imagem muito grande. Máximo 5MB." }
  }

  const { data: usuarioData } = await supabase
    .from("usuarios")
    .select("organizacao_id")
    .eq("id", user.id)
    .single()

  if (!usuarioData) {
    return { erro: "Usuário não encontrado." }
  }

  const ext = arquivo.type === "image/jpeg" ? "jpg" : arquivo.type.split("/")[1]
  const caminho = `${usuarioData.organizacao_id}/avatares/${user.id}.${ext}`

  const arrayBuffer = await arquivo.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(caminho, buffer, {
      contentType: arquivo.type,
      upsert: true,
    })

  if (uploadError) {
    return { erro: "Erro ao fazer upload da imagem." }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("site-assets").getPublicUrl(caminho)

  const { error: updateError } = await supabase
    .from("usuarios")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)

  if (updateError) {
    return { erro: "Erro ao atualizar foto de perfil." }
  }

  return { sucesso: "Foto de perfil atualizada!" }
}
