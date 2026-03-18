"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { getOpenAI } from "@/lib/openai"
import type { TarefaRoadmap, AnaliseRoadmap, ResumoRoadmap, DadosTarefaRoadmap, StatusRoadmap } from "@/types/roadmap"

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
// Gerar análise da IA
// ============================================================

export async function gerarAnaliseRoadmap() {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro) return { erro }
  if (!supabase) return { erro: "Erro interno." }

  // Buscar todas as tarefas
  const { data: tarefas } = await supabase
    .from("tarefas_roadmap")
    .select("titulo, status, data_conclusao")
    .order("created_at", { ascending: true })

  if (!tarefas || tarefas.length === 0) {
    return { erro: "Nenhuma tarefa encontrada para analisar." }
  }

  // Montar resumo
  const resumo = await buscarResumoRoadmap()

  // Agrupar tarefas por data
  const concluidas = tarefas.filter(t => t.status === "concluido")
  const datasUnicas = [...new Set(concluidas.map(t => t.data_conclusao).filter(Boolean))]

  const prompt = `Você é um analista de projetos de software. Analise o progresso deste projeto e gere um relatório em português brasileiro.

## Dados do projeto: LyneImob (CRM imobiliário SaaS)

### Resumo numérico
- Total de tarefas: ${resumo.total_geral}
- Concluídas: ${resumo.total_concluido}
- Em andamento: ${resumo.total_fazendo}
- A fazer: ${resumo.total_a_fazer}
- Aguardando validação: ${resumo.total_pronto}
- Sugestões pendentes: ${resumo.total_sugestao}

### Datas de trabalho
${datasUnicas.sort().map(d => `- ${d}: ${concluidas.filter(t => t.data_conclusao === d).length} tarefas concluídas`).join("\n")}

### Lista de tarefas concluídas
${concluidas.map(t => `- ${t.titulo}`).join("\n")}

### Tarefas pendentes
${tarefas.filter(t => t.status !== "concluido").map(t => `- [${t.status}] ${t.titulo}`).join("\n") || "Nenhuma"}

## Instruções
Gere um relatório conciso (3-5 parágrafos) analisando:
1. Ritmo de desenvolvimento (tarefas por dia)
2. Áreas mais trabalhadas (módulos, integrações, fixes)
3. Evolução do projeto (do início até agora)
4. Situação atual e próximos passos sugeridos

Tom: profissional mas acessível. Sem jargão excessivo.`

  try {
    const openai = getOpenAI()
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const conteudo = resposta.choices[0]?.message?.content
    if (!conteudo) return { erro: "IA não retornou resposta." }

    // Salvar análise no banco
    await supabase.from("analise_roadmap").insert({
      conteudo,
      dados_resumo: resumo,
    })

    revalidatePath("/admin/roadmap")
    return { sucesso: "Análise gerada.", conteudo }
  } catch {
    return { erro: "Erro ao gerar análise. Verifique a chave da OpenAI." }
  }
}

// ============================================================
// Buscar última análise
// ============================================================

export async function buscarUltimaAnalise(): Promise<AnaliseRoadmap | null> {
  const { erro, supabase } = await verificarSuperAdmin()
  if (erro || !supabase) return null

  const { data } = await supabase
    .from("analise_roadmap")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return data as AnaliseRoadmap | null
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
