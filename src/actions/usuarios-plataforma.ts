"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { ehSuperAdmin } from "@/lib/permissoes"
import { calcularRange } from "@/lib/paginacao"
import type { PerfilPlataforma } from "@/lib/permissoes"

// ============================================================
// Helpers
// ============================================================

async function verificarAcessoAdmin() {
  const supabase = await criarClienteServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: "Não autenticado." }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (!usuario || !ehSuperAdmin(usuario)) {
    return { erro: "Apenas super admins podem gerenciar usuários da plataforma." }
  }

  return { erro: null }
}

// ============================================================
// Tipos
// ============================================================

export type UsuarioPlataforma = {
  id: string
  nome: string
  email: string
  cargo: string
  perfil_plataforma: PerfilPlataforma
  ativo: boolean
  created_at: string
  organizacao_id: string | null
  organizacao_nome: string | null
}

export type FiltrosUsuariosPlataforma = {
  busca?: string
  cargo?: string
  organizacao?: string
  status?: string
}

// ============================================================
// Listar todos os usuarios da plataforma (com filtros e paginação)
// ============================================================

export async function listarUsuariosPlataforma(
  filtros?: FiltrosUsuariosPlataforma,
  pagina = 1,
  porPagina = 12
): Promise<{ usuarios: UsuarioPlataforma[]; total: number; organizacoes: { id: string; nome: string }[] }> {
  const admin = criarClienteAdmin()

  let query = admin
    .from("usuarios")
    .select("id, nome, email, cargo, perfil_plataforma, ativo, created_at, organizacao_id", { count: "exact" })

  if (filtros?.busca) {
    query = query.or(
      `nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%`
    )
  }
  if (filtros?.cargo) {
    query = query.eq("cargo", filtros.cargo)
  }
  if (filtros?.organizacao) {
    query = query.eq("organizacao_id", filtros.organizacao)
  }
  if (filtros?.status) {
    query = query.eq("ativo", filtros.status === "ativo")
  }

  const { inicio, fim } = calcularRange(pagina, porPagina)

  const { data: usuarios, count } = await query
    .order("created_at", { ascending: false })
    .range(inicio, fim)

  if (!usuarios || usuarios.length === 0) {
    // Mesmo sem resultados, buscar orgs pro dropdown de filtros
    const { data: todasOrgs } = await admin
      .from("organizacoes")
      .select("id, nome")
      .order("nome")

    return { usuarios: [], total: 0, organizacoes: todasOrgs ?? [] }
  }

  // Buscar nomes das organizacoes dos usuarios retornados + lista completa pra filtros
  const orgIds = [...new Set(usuarios.map((u) => u.organizacao_id).filter(Boolean))]

  const [{ data: orgsUsuarios }, { data: todasOrgs }] = await Promise.all([
    admin.from("organizacoes").select("id, nome").in("id", orgIds),
    admin.from("organizacoes").select("id, nome").order("nome"),
  ])

  const orgMap = new Map(orgsUsuarios?.map((o) => [o.id, o.nome]) ?? [])

  return {
    usuarios: usuarios.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      cargo: u.cargo,
      perfil_plataforma: u.perfil_plataforma as PerfilPlataforma,
      ativo: u.ativo,
      created_at: u.created_at,
      organizacao_id: u.organizacao_id,
      organizacao_nome: orgMap.get(u.organizacao_id) ?? null,
    })),
    total: count ?? 0,
    organizacoes: todasOrgs ?? [],
  }
}

// ============================================================
// Atualizar perfil de plataforma de um usuario
// ============================================================

export async function atualizarPerfilPlataforma(
  usuarioId: string,
  perfil: PerfilPlataforma
): Promise<{ erro?: string; sucesso?: string }> {
  const acesso = await verificarAcessoAdmin()
  if (acesso.erro) return { erro: acesso.erro }

  const admin = criarClienteAdmin()

  const { error } = await admin
    .from("usuarios")
    .update({ perfil_plataforma: perfil })
    .eq("id", usuarioId)

  if (error) {
    return { erro: `Erro ao atualizar perfil: ${error.message}` }
  }

  revalidatePath("/admin/usuarios")
  const label = perfil
    ? { super_admin: "Super Admin", desenvolvedor: "Desenvolvedor", investidor: "Investidor" }[perfil]
    : "Usuário comum"
  return { sucesso: `Perfil atualizado para ${label}.` }
}

// ============================================================
// Criar usuario na plataforma (direto, sem convite)
// O trigger criar_usuario_e_organizacao no banco cria automaticamente
// uma org + registro em usuarios ao inserir em auth.users.
// Entao criamos o auth user, esperamos o trigger agir, e depois
// atualizamos o registro com os dados corretos.
// ============================================================

export type DadosCriarUsuario = {
  nome: string
  email: string
  senha: string
  tipo: "plataforma" | "organizacao"
  // Se tipo = "plataforma"
  perfil_plataforma?: "super_admin" | "desenvolvedor" | "investidor"
  // Se tipo = "organizacao"
  cargo?: "admin" | "gerente" | "corretor"
  organizacao_id?: string
}

export async function criarUsuarioPlataforma(
  dados: DadosCriarUsuario
): Promise<{ erro?: string; sucesso?: string }> {
  const acesso = await verificarAcessoAdmin()
  if (acesso.erro) return { erro: acesso.erro }

  // Validacoes
  if (!dados.nome?.trim()) return { erro: "Nome é obrigatório." }
  if (!dados.email?.trim()) return { erro: "Email é obrigatório." }
  if (!dados.senha || dados.senha.length < 6) return { erro: "Senha deve ter pelo menos 6 caracteres." }

  if (dados.tipo === "organizacao") {
    if (!dados.cargo) return { erro: "Cargo é obrigatório para usuários de organização." }
    if (!["admin", "gerente", "corretor"].includes(dados.cargo)) return { erro: "Cargo inválido." }
    if (!dados.organizacao_id) return { erro: "Organização é obrigatória para usuários de organização." }
  }

  if (dados.tipo === "plataforma") {
    if (!dados.perfil_plataforma) return { erro: "Perfil plataforma é obrigatório." }
    if (!["super_admin", "desenvolvedor", "investidor"].includes(dados.perfil_plataforma)) {
      return { erro: "Perfil plataforma inválido." }
    }
  }

  const admin = criarClienteAdmin()

  // Verificar se email ja existe
  const { data: existente } = await admin
    .from("usuarios")
    .select("id")
    .eq("email", dados.email.trim().toLowerCase())
    .maybeSingle()

  if (existente) return { erro: "Já existe um usuário com esse email." }

  // Criar auth user — o trigger no banco cria automaticamente
  // uma org temporaria + registro em usuarios
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: dados.email.trim().toLowerCase(),
    password: dados.senha,
    email_confirm: true,
    user_metadata: { nome: dados.nome.trim() },
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

  if (dados.tipo === "organizacao") {
    // Mover para a org correta com o cargo correto
    const { error: updateError } = await admin
      .from("usuarios")
      .update({
        cargo: dados.cargo,
        organizacao_id: dados.organizacao_id,
      })
      .eq("id", userId)

    if (updateError) {
      await admin.auth.admin.deleteUser(userId)
      return { erro: `Erro ao vincular organização: ${updateError.message}` }
    }

    // Limpar org temporaria criada pelo trigger (se vazia e diferente da destino)
    if (autoOrgId && autoOrgId !== dados.organizacao_id) {
      const { count } = await admin
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("organizacao_id", autoOrgId)

      if (count === 0) {
        await admin.from("organizacoes").delete().eq("id", autoOrgId)
      }
    }
  } else {
    // Usuario plataforma: definir perfil, manter na org temporaria
    // (organizacao_id e NOT NULL no banco, entao plataforma users
    // ficam na org auto-criada mas acessam tudo via perfil_plataforma)
    const { error: updateError } = await admin
      .from("usuarios")
      .update({ perfil_plataforma: dados.perfil_plataforma })
      .eq("id", userId)

    if (updateError) {
      await admin.auth.admin.deleteUser(userId)
      return { erro: `Erro ao definir perfil: ${updateError.message}` }
    }
  }

  revalidatePath("/admin/usuarios")
  revalidatePath("/admin/organizacoes")
  return { sucesso: `Usuário ${dados.nome} criado com sucesso.` }
}

// ============================================================
// Alterar cargo de qualquer usuario (admin bypass RLS)
// ============================================================

export async function alterarCargoAdmin(
  usuarioId: string,
  novoCargo: string
): Promise<{ erro?: string; sucesso?: string }> {
  const acesso = await verificarAcessoAdmin()
  if (acesso.erro) return { erro: acesso.erro }

  if (!["admin", "gerente", "corretor"].includes(novoCargo)) {
    return { erro: "Cargo inválido." }
  }

  const admin = criarClienteAdmin()

  const { error } = await admin
    .from("usuarios")
    .update({ cargo: novoCargo })
    .eq("id", usuarioId)

  if (error) {
    return { erro: `Erro ao alterar cargo: ${error.message}` }
  }

  revalidatePath("/admin/organizacoes")
  revalidatePath("/admin/usuarios")
  return { sucesso: "Cargo alterado com sucesso." }
}

// ============================================================
// Alternar status de qualquer usuario (admin bypass RLS)
// ============================================================

export async function alternarStatusAdmin(
  usuarioId: string
): Promise<{ erro?: string; sucesso?: string }> {
  const acesso = await verificarAcessoAdmin()
  if (acesso.erro) return { erro: acesso.erro }

  const admin = criarClienteAdmin()

  const { data: usuario } = await admin
    .from("usuarios")
    .select("ativo")
    .eq("id", usuarioId)
    .single()

  if (!usuario) return { erro: "Usuário não encontrado." }

  const { error } = await admin
    .from("usuarios")
    .update({ ativo: !usuario.ativo })
    .eq("id", usuarioId)

  if (error) {
    return { erro: `Erro ao alterar status: ${error.message}` }
  }

  revalidatePath("/admin/organizacoes")
  revalidatePath("/admin/usuarios")
  return { sucesso: usuario.ativo ? "Usuário desativado." : "Usuário ativado." }
}

// ============================================================
// Remover qualquer usuario (admin bypass RLS)
// ============================================================

export async function removerUsuarioAdmin(
  usuarioId: string
): Promise<{ erro?: string; sucesso?: string }> {
  const acesso = await verificarAcessoAdmin()
  if (acesso.erro) return { erro: acesso.erro }

  const admin = criarClienteAdmin()

  const { error } = await admin.auth.admin.deleteUser(usuarioId)

  if (error) {
    return { erro: `Erro ao remover usuário: ${error.message}` }
  }

  revalidatePath("/admin/organizacoes")
  revalidatePath("/admin/usuarios")
  return { sucesso: "Usuário removido com sucesso." }
}

// ============================================================
// Mover usuario para outra organizacao (admin bypass RLS)
// ============================================================

export async function moverOrganizacaoAdmin(
  usuarioId: string,
  novaOrganizacaoId: string,
  novoCargo?: string
): Promise<{ erro?: string; sucesso?: string }> {
  const acesso = await verificarAcessoAdmin()
  if (acesso.erro) return { erro: acesso.erro }

  const admin = criarClienteAdmin()

  // Verificar se org destino existe
  const { data: orgDestino } = await admin
    .from("organizacoes")
    .select("id, nome")
    .eq("id", novaOrganizacaoId)
    .single()

  if (!orgDestino) return { erro: "Organização não encontrada." }

  const atualizacao: Record<string, unknown> = {
    organizacao_id: novaOrganizacaoId,
  }

  if (novoCargo && ["admin", "gerente", "corretor"].includes(novoCargo)) {
    atualizacao.cargo = novoCargo
  }

  const { error } = await admin
    .from("usuarios")
    .update(atualizacao)
    .eq("id", usuarioId)

  if (error) {
    return { erro: `Erro ao mover usuário: ${error.message}` }
  }

  revalidatePath("/admin/organizacoes")
  revalidatePath("/admin/usuarios")
  return { sucesso: `Usuário movido para ${orgDestino.nome}.` }
}

// ============================================================
// Listar todas as organizacoes (para selects/dropdowns)
// ============================================================

export async function listarOrganizacoesAdmin(): Promise<{ id: string; nome: string }[]> {
  const admin = criarClienteAdmin()

  const { data } = await admin
    .from("organizacoes")
    .select("id, nome")
    .order("nome")

  return data ?? []
}
