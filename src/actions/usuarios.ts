"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { verificarPermissao } from "@/lib/permissoes"
import { verificarLimiteCorretores } from "@/lib/verificar-limites"
import crypto from "crypto"

// ============================================================
// Helpers
// ============================================================

async function buscarUsuarioLogado() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  return usuario
}

// ============================================================
// Listar usuarios da organizacao
// ============================================================

export async function listarUsuarios() {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const supabase = await criarClienteServer()

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, telefone, cargo, avatar_url, creci, ativo, created_at")
    .eq("organizacao_id", usuario.organizacao_id)
    .order("created_at", { ascending: true })

  if (error) {
    return { erro: "Erro ao buscar usuarios." }
  }

  return { dados: data }
}

// ============================================================
// Listar convites da organizacao
// ============================================================

export async function listarConvites() {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { data, error } = await supabase
    .from("convites")
    .select("*, usuarios:convidado_por(id, nome)")
    .eq("organizacao_id", usuario.organizacao_id)
    .order("created_at", { ascending: false })

  if (error) {
    return { erro: "Erro ao buscar convites." }
  }

  return { dados: data }
}

// ============================================================
// Convidar usuario
// ============================================================

export async function convidarUsuario(formData: FormData) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  const email = formData.get("email") as string
  const cargo = formData.get("cargo") as string

  if (!email || !email.includes("@")) {
    return { erro: "Email invalido." }
  }

  if (!["admin", "corretor", "gerente"].includes(cargo)) {
    return { erro: "Cargo invalido." }
  }

  const supabase = await criarClienteServer()

  // Verificar se ja existe usuario com esse email na org
  const { data: usuarioExistente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (usuarioExistente) {
    return { erro: "Ja existe um usuario com esse email nesta organizacao." }
  }

  // Verificar se ja existe convite pendente
  const { data: conviteExistente } = await supabase
    .from("convites")
    .select("id")
    .eq("email", email)
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("status", "pendente")
    .single()

  if (conviteExistente) {
    return { erro: "Ja existe um convite pendente para este email." }
  }

  // Verificar limite de membros do plano
  const limite = await verificarLimiteCorretores(usuario.organizacao_id)
  if (!limite.permitido) {
    return { erro: limite.mensagem }
  }

  // Gerar token unico
  const token = crypto.randomBytes(32).toString("hex")

  // Criar convite (expira em 7 dias)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase
    .from("convites")
    .insert({
      organizacao_id: usuario.organizacao_id,
      convidado_por: usuario.id,
      email,
      cargo,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    return { erro: "Erro ao criar convite." }
  }

  return {
    sucesso: "Convite criado com sucesso!",
    token,
  }
}

// ============================================================
// Revogar convite
// ============================================================

export async function revogarConvite(conviteId: string) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("convites")
    .update({ status: "revogado" })
    .eq("id", conviteId)
    .eq("organizacao_id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao revogar convite." }
  }

  return { sucesso: "Convite revogado." }
}

// ============================================================
// Alterar cargo de usuario
// ============================================================

export async function alterarCargo(usuarioAlvoId: string, novoCargo: string) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  if (!["admin", "corretor", "gerente"].includes(novoCargo)) {
    return { erro: "Cargo invalido." }
  }

  // Nao pode alterar o proprio cargo
  if (usuarioAlvoId === usuario.id) {
    return { erro: "Voce nao pode alterar seu proprio cargo." }
  }

  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("usuarios")
    .update({ cargo: novoCargo })
    .eq("id", usuarioAlvoId)
    .eq("organizacao_id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao alterar cargo." }
  }

  return { sucesso: `Cargo alterado para ${novoCargo}.` }
}

// ============================================================
// Desativar/ativar usuario
// ============================================================

export async function alternarStatusUsuario(usuarioAlvoId: string) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  // Nao pode desativar a si mesmo
  if (usuarioAlvoId === usuario.id) {
    return { erro: "Voce nao pode desativar sua propria conta." }
  }

  const supabase = await criarClienteServer()

  // Buscar status atual
  const { data: alvo } = await supabase
    .from("usuarios")
    .select("ativo")
    .eq("id", usuarioAlvoId)
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (!alvo) {
    return { erro: "Usuario nao encontrado." }
  }

  const { error } = await supabase
    .from("usuarios")
    .update({ ativo: !alvo.ativo })
    .eq("id", usuarioAlvoId)
    .eq("organizacao_id", usuario.organizacao_id)

  if (error) {
    return { erro: "Erro ao alterar status do usuario." }
  }

  return { sucesso: alvo.ativo ? "Usuario desativado." : "Usuario reativado." }
}

// ============================================================
// Remover usuario da organizacao
// ============================================================

export async function removerUsuario(usuarioAlvoId: string) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  // Nao pode remover a si mesmo
  if (usuarioAlvoId === usuario.id) {
    return { erro: "Voce nao pode remover sua propria conta." }
  }

  // Usar admin client para deletar o auth user (cascade remove da tabela usuarios)
  const supabaseAdmin = criarClienteAdmin()

  const { error } = await supabaseAdmin.auth.admin.deleteUser(usuarioAlvoId)

  if (error) {
    return { erro: "Erro ao remover usuario." }
  }

  return { sucesso: "Usuario removido da organizacao." }
}
