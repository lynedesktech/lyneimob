"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import type { TarefaRoadmap, ResumoRoadmap, DadosTarefaRoadmap, StatusRoadmap, ItemChecklist, PrioridadeRoadmap } from "@/types/roadmap"

// ============================================================
// Helpers
// ============================================================

async function verificarSuperAdmin() {
  const supabase = await criarClienteServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: "Não autenticado.", supabase: null }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, super_admin")
    .eq("id", user.id)
    .single()

  if (!usuario?.super_admin) return { erro: "Acesso negado.", supabase: null }
  return { erro: null, supabase }
}

// ============================================================
// Listar tarefas
// ============================================================

export async function listarTarefasRoadmap(): Promise<TarefaRoadmap[]> {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro || !supabase) return []

  const { data } = await supabase
    .from("tarefas_roadmap")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false })

  return (data as TarefaRoadmap[]) || []
}

// ============================================================
// Resumo (contadores)
// ============================================================

export async function buscarResumoRoadmap(): Promise<ResumoRoadmap> {
  const { erro, supabase } = await verificarSuperAdmin()
  const vazio: ResumoRoadmap = {
    total_a_fazer: 0, total_fazendo: 0, total_pronto: 0,
    total_concluido: 0, total_sugestao: 0, total_geral: 0,
  }
  if (erro || !supabase) return vazio

  const { data } = await supabase.from("tarefas_roadmap").select("status")
  if (!data) return vazio

  const resumo = { ...vazio }
  for (const t of data) {
    const chave = `total_${t.status}` as keyof ResumoRoadmap
    if (chave in resumo) (resumo[chave] as number)++
    resumo.total_geral++
  }
  return resumo
}

// ============================================================
// Buscar tarefa por ID
// ============================================================

export async function buscarTarefaRoadmap(id: string): Promise<TarefaRoadmap | null> {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro || !supabase) return null

  const { data } = await supabase
    .from("tarefas_roadmap")
    .select("*")
    .eq("id", id)
    .single()

  return data as TarefaRoadmap | null
}

// ============================================================
// Atualizar tarefa (edição completa)
// ============================================================

export async function atualizarTarefaRoadmap(
  id: string,
  dados: {
    titulo?: string
    descricao?: string | null
    status?: StatusRoadmap
    prioridade?: PrioridadeRoadmap
    checklist?: ItemChecklist[]
  }
) {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase) return { erro: "Erro interno." }

  const atualizacao: Record<string, unknown> = { ...dados }
  if (dados.status === "concluido") {
    atualizacao.data_conclusao = new Date().toISOString().split("T")[0]
  }

  const { error } = await supabase
    .from("tarefas_roadmap")
    .update(atualizacao)
    .eq("id", id)

  if (error) return { erro: error.message }
  revalidatePath("/admin/roadmap")
  revalidatePath(`/admin/roadmap/${id}`)
  return { sucesso: "Tarefa atualizada." }
}

// ============================================================
// Criar tarefa
// ============================================================

export async function criarTarefaRoadmap(dados: DadosTarefaRoadmap) {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase) return { erro: "Erro interno." }

  const { error } = await supabase.from("tarefas_roadmap").insert({
    titulo: dados.titulo,
    descricao: dados.descricao || null,
    status: dados.status,
    prioridade: dados.prioridade || "media",
    checklist: dados.checklist || [],
    data_conclusao: dados.data_conclusao || null,
    ordem: dados.ordem,
  })

  if (error) return { erro: error.message }
  revalidatePath("/admin/roadmap")
  return { sucesso: "Tarefa criada." }
}

// ============================================================
// Atualizar status
// ============================================================

export async function atualizarStatusTarefa(id: string, status: StatusRoadmap) {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase) return { erro: "Erro interno." }

  const atualizacao: Record<string, unknown> = { status }
  if (status === "concluido") {
    atualizacao.data_conclusao = new Date().toISOString().split("T")[0]
  }

  const { error } = await supabase
    .from("tarefas_roadmap")
    .update(atualizacao)
    .eq("id", id)

  if (error) return { erro: error.message }
  revalidatePath("/admin/roadmap")
  return { sucesso: "Status atualizado." }
}

// ============================================================
// Excluir tarefa
// ============================================================

export async function excluirTarefaRoadmap(id: string) {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase) return { erro: "Erro interno." }

  const { error } = await supabase
    .from("tarefas_roadmap")
    .delete()
    .eq("id", id)

  if (error) return { erro: error.message }
  revalidatePath("/admin/roadmap")
  return { sucesso: "Tarefa excluída." }
}

// ============================================================
// Popular tarefas em lote (usado para importar do roadmap.md)
// ============================================================

export async function popularTarefasEmLote(tarefas: DadosTarefaRoadmap[]) {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase) return { erro: "Erro interno." }

  const registros = tarefas.map((t, i) => ({
    titulo: t.titulo,
    descricao: t.descricao || null,
    status: t.status,
    data_conclusao: t.data_conclusao || null,
    ordem: t.ordem || i,
  }))

  const { error } = await supabase.from("tarefas_roadmap").insert(registros)
  if (error) return { erro: error.message }

  revalidatePath("/admin/roadmap")
  return { sucesso: `${registros.length} tarefas importadas.` }
}
