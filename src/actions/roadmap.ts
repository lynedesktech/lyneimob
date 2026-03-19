"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import type {
  TarefaRoadmap, ResumoRoadmap, DadosTarefaRoadmap,
  StatusRoadmap, ItemChecklist, PrioridadeRoadmap,
  HistoricoTarefaRoadmap, TipoMudancaRoadmap,
} from "@/types/roadmap"
import { STATUS_ROADMAP, PRIORIDADE_ROADMAP } from "@/types/roadmap"
import { ehSuperAdmin, ehDesenvolvedor } from "@/lib/permissoes"

// ============================================================
// Helpers
// ============================================================

type SupabaseClient = Awaited<ReturnType<typeof criarClienteServer>>

async function verificarSuperAdmin() {
  const supabase = await criarClienteServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: "Não autenticado.", supabase: null, usuarioId: null }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (!usuario || (!ehSuperAdmin(usuario) && !ehDesenvolvedor(usuario))) return { erro: "Acesso negado.", supabase: null, usuarioId: null }
  return { erro: null, supabase, usuarioId: usuario.id as string }
}

async function registrarHistorico(
  supabase: SupabaseClient,
  tarefaId: string,
  usuarioId: string,
  tipo: TipoMudancaRoadmap,
  descricao: string,
  valorAnterior?: string | null,
  valorNovo?: string | null,
) {
  await supabase.from("historico_tarefas_roadmap").insert({
    tarefa_id: tarefaId,
    usuario_id: usuarioId,
    tipo,
    valor_anterior: valorAnterior ?? null,
    valor_novo: valorNovo ?? null,
    descricao,
  })
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
// Buscar histórico de uma tarefa
// ============================================================

export async function buscarHistoricoTarefa(tarefaId: string): Promise<HistoricoTarefaRoadmap[]> {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro || !supabase) return []

  const { data } = await supabase
    .from("historico_tarefas_roadmap")
    .select("*, usuarios!historico_tarefas_roadmap_usuario_id_fkey(nome)")
    .eq("tarefa_id", tarefaId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((h: Record<string, unknown>) => {
    const registro = h as Record<string, unknown> & { usuarios?: { nome: string } | null }
    return {
      id: registro.id as string,
      tarefa_id: registro.tarefa_id as string,
      usuario_id: registro.usuario_id as string,
      tipo: registro.tipo as TipoMudancaRoadmap,
      valor_anterior: registro.valor_anterior as string | null,
      valor_novo: registro.valor_novo as string | null,
      descricao: registro.descricao as string,
      created_at: registro.created_at as string,
      usuario_nome: registro.usuarios?.nome || "Desconhecido",
    } satisfies HistoricoTarefaRoadmap
  })
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
    responsavel_id?: string | null
    data_vencimento?: string | null
  }
) {
  const { erro, supabase, usuarioId } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase || !usuarioId) return { erro: "Erro interno." }

  // Buscar dados atuais para comparar e gerar logs
  const { data: atual } = await supabase
    .from("tarefas_roadmap")
    .select("*")
    .eq("id", id)
    .single()

  if (!atual) return { erro: "Tarefa não encontrada." }

  const atualizacao: Record<string, unknown> = { ...dados }
  if (dados.status === "concluido") {
    atualizacao.data_conclusao = new Date().toISOString().split("T")[0]
  }

  const { error } = await supabase
    .from("tarefas_roadmap")
    .update(atualizacao)
    .eq("id", id)

  if (error) return { erro: error.message }

  // Registrar histórico de cada mudança
  if (dados.status !== undefined && dados.status !== atual.status) {
    const labelAnterior = STATUS_ROADMAP[atual.status as StatusRoadmap]?.label || atual.status
    const labelNovo = STATUS_ROADMAP[dados.status]?.label || dados.status
    await registrarHistorico(supabase, id, usuarioId, "status",
      `Mudou status de ${labelAnterior} para ${labelNovo}`,
      atual.status, dados.status)
  }

  if (dados.prioridade !== undefined && dados.prioridade !== atual.prioridade) {
    const labelAnterior = PRIORIDADE_ROADMAP[atual.prioridade as PrioridadeRoadmap]?.label || atual.prioridade
    const labelNovo = PRIORIDADE_ROADMAP[dados.prioridade]?.label || dados.prioridade
    await registrarHistorico(supabase, id, usuarioId, "prioridade",
      `Mudou prioridade de ${labelAnterior} para ${labelNovo}`,
      atual.prioridade, dados.prioridade)
  }

  if (dados.titulo !== undefined && dados.titulo !== atual.titulo) {
    await registrarHistorico(supabase, id, usuarioId, "titulo",
      `Editou o título`,
      atual.titulo, dados.titulo)
  }

  if (dados.descricao !== undefined && dados.descricao !== atual.descricao) {
    await registrarHistorico(supabase, id, usuarioId, "descricao",
      `Editou a descrição`)
  }

  if (dados.checklist !== undefined) {
    const checklistAnterior = (atual.checklist || []) as ItemChecklist[]
    const checklistNovo = dados.checklist

    // Detectar itens marcados/desmarcados
    for (let i = 0; i < checklistNovo.length; i++) {
      const anterior = checklistAnterior[i]
      const novo = checklistNovo[i]
      if (anterior && anterior.texto === novo.texto && anterior.concluido !== novo.concluido) {
        await registrarHistorico(supabase, id, usuarioId, "checklist",
          novo.concluido ? `Marcou "${novo.texto}" como concluído` : `Desmarcou "${novo.texto}"`)
      }
    }

    // Detectar itens adicionados
    if (checklistNovo.length > checklistAnterior.length) {
      const novosItens = checklistNovo.slice(checklistAnterior.length)
      for (const item of novosItens) {
        await registrarHistorico(supabase, id, usuarioId, "checklist",
          `Adicionou item "${item.texto}" ao checklist`)
      }
    }

    // Detectar itens removidos
    if (checklistNovo.length < checklistAnterior.length) {
      const removidos = checklistAnterior.filter(
        (a) => !checklistNovo.some((n) => n.texto === a.texto)
      )
      for (const item of removidos) {
        await registrarHistorico(supabase, id, usuarioId, "checklist",
          `Removeu item "${item.texto}" do checklist`)
      }
    }
  }

  if (dados.responsavel_id !== undefined && dados.responsavel_id !== atual.responsavel_id) {
    await registrarHistorico(supabase, id, usuarioId, "responsavel",
      dados.responsavel_id ? "Definiu responsável" : "Removeu responsável")
  }

  if (dados.data_vencimento !== undefined && dados.data_vencimento !== atual.data_vencimento) {
    await registrarHistorico(supabase, id, usuarioId, "vencimento",
      dados.data_vencimento
        ? `Definiu vencimento para ${new Date(dados.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}`
        : "Removeu data de vencimento",
      atual.data_vencimento, dados.data_vencimento)
  }

  revalidatePath("/admin/roadmap")
  revalidatePath(`/admin/roadmap/${id}`)
  return { sucesso: "Tarefa atualizada." }
}

// ============================================================
// Criar tarefa
// ============================================================

export async function criarTarefaRoadmap(dados: DadosTarefaRoadmap) {
  const { erro, supabase, usuarioId } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase || !usuarioId) return { erro: "Erro interno." }

  const { data: novaTarefa, error } = await supabase.from("tarefas_roadmap").insert({
    titulo: dados.titulo,
    descricao: dados.descricao || null,
    status: dados.status,
    prioridade: dados.prioridade || "media",
    checklist: dados.checklist || [],
    data_conclusao: dados.data_conclusao || null,
    ordem: dados.ordem,
  }).select("id").single()

  if (error) return { erro: error.message }

  if (novaTarefa) {
    await registrarHistorico(supabase, novaTarefa.id, usuarioId, "criacao",
      `Criou a tarefa "${dados.titulo}"`)
  }

  revalidatePath("/admin/roadmap")
  return { sucesso: "Tarefa criada.", tarefaId: novaTarefa?.id }
}

// ============================================================
// Atualizar status
// ============================================================

export async function atualizarStatusTarefa(id: string, status: StatusRoadmap) {
  return atualizarTarefaRoadmap(id, { status })
}

// ============================================================
// Excluir tarefa
// ============================================================

export async function excluirTarefaRoadmap(id: string) {
  const { erro, supabase, usuarioId } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase || !usuarioId) return { erro: "Erro interno." }

  // Histórico será deletado por CASCADE, mas registrar antes não faz sentido
  // pois a tarefa será removida. Apenas deletar.
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
    prioridade: t.prioridade || "media",
    checklist: t.checklist || [],
    data_conclusao: t.data_conclusao || null,
    data_vencimento: t.data_vencimento || null,
    responsavel_id: t.responsavel_id || null,
    ordem: t.ordem || i,
  }))

  const { error } = await supabase.from("tarefas_roadmap").insert(registros)
  if (error) return { erro: error.message }

  revalidatePath("/admin/roadmap")
  return { sucesso: `${registros.length} tarefas importadas.` }
}

// ============================================================
// Buscar usuários super admin (para dropdown de responsável)
// ============================================================

export async function buscarUsuariosSuperAdmin(): Promise<{ id: string; nome: string }[]> {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro || !supabase) return []

  const { data } = await supabase
    .from("usuarios")
    .select("id, nome")
    .eq("super_admin", true)
    .order("nome")

  return (data as { id: string; nome: string }[]) || []
}
