"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Helper
// ============================================================

async function buscarAdminOuGerente() {
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

  if (!usuario) return null
  if (!["admin", "gerente"].includes(usuario.cargo)) return null

  return { supabase, usuario }
}

function revalidarTipos() {
  revalidatePath("/atividades")
  revalidatePath("/configuracoes/tipos-atividade")
}

// ============================================================
// Criar tipo de atividade
// ============================================================

export async function criarTipoAtividade(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const nome = (formData.get("nome") as string)?.trim()
  const cor = (formData.get("cor") as string) || "#6b7280"

  if (!nome || nome.length < 2) {
    return { erro: "Nome deve ter pelo menos 2 caracteres" }
  }

  const ctx = await buscarAdminOuGerente()
  if (!ctx) return { erro: "Sem permissão para criar tipos de atividade" }

  const { supabase, usuario } = ctx

  // Gerar slug a partir do nome (remove acentos, espaços → underscore, minúsculas)
  const slug = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")

  // Descobrir próxima ordem
  const { data: ultimo } = await supabase
    .from("tipos_atividade")
    .select("ordem")
    .eq("organizacao_id", usuario.organizacao_id)
    .order("ordem", { ascending: false })
    .limit(1)
    .single()

  const novaOrdem = (ultimo?.ordem ?? -1) + 1

  const { error } = await supabase.from("tipos_atividade").insert({
    organizacao_id: usuario.organizacao_id,
    nome,
    slug,
    cor,
    icone: "activity",
    ordem: novaOrdem,
    sistema: false,
  })

  if (error) {
    if (error.code === "23505") return { erro: "Já existe um tipo com esse nome" }
    return { erro: "Erro ao criar tipo. Tente novamente." }
  }

  revalidarTipos()
  return { sucesso: "Tipo criado com sucesso!" }
}

// ============================================================
// Atualizar tipo de atividade
// ============================================================

export async function atualizarTipoAtividade(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const id = formData.get("id") as string
  const nome = (formData.get("nome") as string)?.trim()
  const cor = (formData.get("cor") as string) || "#6b7280"

  if (!id) return { erro: "ID do tipo não informado" }
  if (!nome || nome.length < 2) return { erro: "Nome deve ter pelo menos 2 caracteres" }

  const ctx = await buscarAdminOuGerente()
  if (!ctx) return { erro: "Sem permissão para editar tipos de atividade" }

  const { supabase } = ctx

  // Verificar se existe e obter dados
  const { data: tipo } = await supabase
    .from("tipos_atividade")
    .select("sistema")
    .eq("id", id)
    .single()

  if (!tipo) return { erro: "Tipo não encontrado" }

  // Tipos de sistema: pode editar nome e cor, mas não o slug
  const atualizacao: Record<string, unknown> = { nome, cor }

  // Se não for sistema, atualizar o slug também
  if (!tipo.sistema) {
    atualizacao.slug = nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
  }

  const { error } = await supabase
    .from("tipos_atividade")
    .update(atualizacao)
    .eq("id", id)

  if (error) {
    if (error.code === "23505") return { erro: "Já existe um tipo com esse nome" }
    return { erro: "Erro ao atualizar tipo. Tente novamente." }
  }

  revalidarTipos()
  return { sucesso: "Tipo atualizado!" }
}

// ============================================================
// Excluir tipo de atividade
// ============================================================

export async function excluirTipoAtividade(id: string): Promise<EstadoFormulario> {
  const ctx = await buscarAdminOuGerente()
  if (!ctx) return { erro: "Sem permissão para excluir tipos de atividade" }

  const { supabase } = ctx

  // Verificar se é tipo de sistema
  const { data: tipo } = await supabase
    .from("tipos_atividade")
    .select("sistema, nome, slug")
    .eq("id", id)
    .single()

  if (!tipo) return { erro: "Tipo não encontrado" }

  if (tipo.sistema) {
    return { erro: `O tipo "${tipo.nome}" é padrão do sistema e não pode ser excluído` }
  }

  // Verificar se há atividades usando esse tipo
  const { count } = await supabase
    .from("atividades")
    .select("id", { count: "exact", head: true })
    .eq("tipo", tipo.slug)

  if (count && count > 0) {
    return { erro: `Não é possível excluir: ${count} atividade${count > 1 ? "s" : ""} usa${count === 1 ? "" : "m"} este tipo. Altere-as primeiro.` }
  }

  const { error } = await supabase.from("tipos_atividade").delete().eq("id", id)

  if (error) return { erro: "Erro ao excluir tipo. Tente novamente." }

  revalidarTipos()
  return { sucesso: "Tipo excluído" }
}

// ============================================================
// Reordenar tipos de atividade
// ============================================================

export async function reordenarTiposAtividade(
  idsNaOrdem: string[]
): Promise<EstadoFormulario> {
  const ctx = await buscarAdminOuGerente()
  if (!ctx) return { erro: "Sem permissão para reordenar tipos" }

  const { supabase } = ctx

  for (let i = 0; i < idsNaOrdem.length; i++) {
    const { error } = await supabase
      .from("tipos_atividade")
      .update({ ordem: i })
      .eq("id", idsNaOrdem[i])

    if (error) return { erro: "Erro ao reordenar. Tente novamente." }
  }

  revalidarTipos()
  return { sucesso: "Ordem atualizada!" }
}
