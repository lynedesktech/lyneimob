"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { ehSuperAdmin } from "@/lib/permissoes"
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
// Listar todos os usuarios da plataforma
// ============================================================

export type UsuarioPlataforma = {
  id: string
  nome: string
  email: string
  cargo: string
  perfil_plataforma: PerfilPlataforma
  ativo: boolean
  created_at: string
  organizacao_nome: string | null
}

export async function listarUsuariosPlataforma(): Promise<UsuarioPlataforma[]> {
  const admin = criarClienteAdmin()

  const { data: usuarios } = await admin
    .from("usuarios")
    .select("id, nome, email, cargo, perfil_plataforma, ativo, created_at, organizacao_id")
    .order("created_at", { ascending: false })

  if (!usuarios || usuarios.length === 0) return []

  // Buscar nomes das organizacoes
  const orgIds = [...new Set(usuarios.map((u) => u.organizacao_id).filter(Boolean))]
  const { data: orgs } = await admin
    .from("organizacoes")
    .select("id, nome")
    .in("id", orgIds)

  const orgMap = new Map(orgs?.map((o) => [o.id, o.nome]) ?? [])

  return usuarios.map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    cargo: u.cargo,
    perfil_plataforma: u.perfil_plataforma as PerfilPlataforma,
    ativo: u.ativo,
    created_at: u.created_at,
    organizacao_nome: orgMap.get(u.organizacao_id) ?? null,
  }))
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
