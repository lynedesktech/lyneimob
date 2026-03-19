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
