"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { verificarPermissao } from "@/lib/permissoes"
import { verificarLimiteCorretores } from "@/lib/verificar-limites"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

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
// Criar usuario direto (admin adiciona membro manualmente)
// ============================================================

export async function criarUsuario(formData: FormData) {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Voce precisa estar logado." }
  }

  const permissao = verificarPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_usuarios")
  if (permissao.erro) {
    return permissao
  }

  const nome = (formData.get("nome") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const senha = formData.get("senha") as string
  const cargo = formData.get("cargo") as string

  if (!nome) {
    return { erro: "Nome é obrigatório." }
  }

  if (!email || !email.includes("@")) {
    return { erro: "Email inválido." }
  }

  if (!senha || senha.length < 6) {
    return { erro: "Senha deve ter no mínimo 6 caracteres." }
  }

  if (!["admin", "corretor", "gerente"].includes(cargo)) {
    return { erro: "Cargo inválido." }
  }

  // Verificar limite de membros do plano
  const limite = await verificarLimiteCorretores(usuario.organizacao_id)
  if (!limite.permitido) {
    return { erro: limite.mensagem }
  }

  const admin = criarClienteAdmin()

  // Verificar se ja existe usuario com esse email na org
  const { data: usuarioExistente } = await admin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .eq("organizacao_id", usuario.organizacao_id)
    .maybeSingle()

  if (usuarioExistente) {
    return { erro: "Já existe um usuário com esse email nesta organização." }
  }

  // Criar auth user — o trigger no banco cria automaticamente
  // uma org temporaria + registro em usuarios
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (authError) {
    return { erro: `Erro ao criar conta: ${authError.message}` }
  }

  if (!authData.user) {
    return { erro: "Erro ao criar conta: usuário não retornado." }
  }

  const userId = authData.user.id

  // Buscar registro criado pelo trigger para saber a org temporaria
  const { data: autoUser } = await admin
    .from("usuarios")
    .select("organizacao_id")
    .eq("id", userId)
    .single()

  const autoOrgId = autoUser?.organizacao_id

  // Mover para a org correta com o cargo correto
  const { error: updateError } = await admin
    .from("usuarios")
    .update({
      cargo,
      organizacao_id: usuario.organizacao_id,
    })
    .eq("id", userId)

  if (updateError) {
    await admin.auth.admin.deleteUser(userId)
    return { erro: `Erro ao vincular organização: ${updateError.message}` }
  }

  // Limpar org temporaria criada pelo trigger (se vazia e diferente da destino)
  if (autoOrgId && autoOrgId !== usuario.organizacao_id) {
    const { count } = await admin
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", autoOrgId)

    if (count === 0) {
      await admin.from("organizacoes").delete().eq("id", autoOrgId)
    }
  }

  return {
    sucesso: "Usuário criado com sucesso!",
    dados: { nome, email, cargo },
  }
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
