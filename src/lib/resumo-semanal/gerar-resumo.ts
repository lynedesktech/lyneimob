import { getOpenAI } from "@/lib/openai"
import { formatarPreco } from "@/lib/formatadores"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { MetricasSemanais, ResumoSemanal } from "@/types/resumo-semanal"

// ============================================================
// Helpers
// ============================================================

/** Retorna segunda-feira e domingo da semana atual */
export function obterLimitesSemana(): { inicio: Date; fim: Date } {
  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0=dom, 1=seg, ..., 6=sab

  const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana
  const segunda = new Date(hoje)
  segunda.setDate(hoje.getDate() + diffSegunda)
  segunda.setHours(0, 0, 0, 0)

  const domingo = new Date(segunda)
  domingo.setDate(segunda.getDate() + 6)
  domingo.setHours(23, 59, 59, 999)

  return { inicio: segunda, fim: domingo }
}

/** Formata Date como 'YYYY-MM-DD' para campos date do Supabase */
export function formatarDateISO(data: Date): string {
  return data.toISOString().split("T")[0]
}

// ============================================================
// Coletar metricas da semana
// ============================================================

export async function coletarMetricasSemanais(
  supabase: SupabaseClient,
  organizacaoId: string,
  semanaInicio: Date,
  semanaFim: Date
): Promise<MetricasSemanais> {
  const inicioISO = semanaInicio.toISOString()
  const fimISO = semanaFim.toISOString()

  // Negocios criados na semana
  const { count: negociosCriados } = await supabase
    .from("negocios")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .gte("created_at", inicioISO)
    .lte("created_at", fimISO)

  // Negocios ganhos na semana
  const { data: negociosGanhos } = await supabase
    .from("negocios")
    .select("valor")
    .eq("organizacao_id", organizacaoId)
    .eq("status", "ganho")
    .gte("data_ganho", inicioISO)
    .lte("data_ganho", fimISO)

  const qtdGanhos = negociosGanhos?.length ?? 0
  const valorGanho = negociosGanhos?.reduce((acc, n) => acc + (n.valor ?? 0), 0) ?? 0

  // Negocios perdidos na semana
  const { count: negociosPerdidos } = await supabase
    .from("negocios")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "perdido")
    .gte("data_perda", inicioISO)
    .lte("data_perda", fimISO)

  // Clientes novos na semana
  const { count: clientesNovos } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .gte("created_at", inicioISO)
    .lte("created_at", fimISO)

  // Total de clientes
  const { count: clientesTotal } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)

  // Imoveis cadastrados na semana
  const { count: imoveisCadastrados } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .gte("created_at", inicioISO)
    .lte("created_at", fimISO)

  // Imoveis vendidos na semana
  const { count: imoveisVendidos } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "vendido")
    .gte("updated_at", inicioISO)
    .lte("updated_at", fimISO)

  // Imoveis alugados na semana
  const { count: imoveisAlugados } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "alugado")
    .gte("updated_at", inicioISO)
    .lte("updated_at", fimISO)

  // Atividades concluidas na semana
  const { count: atividadesConcluidas } = await supabase
    .from("atividades")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "concluida")
    .gte("data_conclusao", inicioISO)
    .lte("data_conclusao", fimISO)

  // Atividades vencidas (pendentes com data_vencimento no passado)
  const agora = new Date().toISOString()
  const { count: atividadesVencidas } = await supabase
    .from("atividades")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "pendente")
    .lt("data_vencimento", agora)

  // Atividades pendentes totais
  const { count: atividadesPendentes } = await supabase
    .from("atividades")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "pendente")

  return {
    negocios: {
      criados: negociosCriados ?? 0,
      ganhos: qtdGanhos,
      perdidos: negociosPerdidos ?? 0,
      valorGanho,
    },
    clientes: {
      novos: clientesNovos ?? 0,
      total: clientesTotal ?? 0,
    },
    imoveis: {
      cadastrados: imoveisCadastrados ?? 0,
      vendidos: imoveisVendidos ?? 0,
      alugados: imoveisAlugados ?? 0,
    },
    atividades: {
      concluidas: atividadesConcluidas ?? 0,
      vencidas: atividadesVencidas ?? 0,
      pendentes: atividadesPendentes ?? 0,
    },
  }
}

// ============================================================
// Gerar resumo para uma organizacao
// ============================================================

export type ResultadoGeracao = {
  sucesso: boolean
  motivo?: "gerado" | "sem_dados" | "limite_ia" | "erro"
  resumo?: ResumoSemanal
  erro?: string
}

export async function gerarResumoParaOrganizacao(
  supabase: SupabaseClient,
  organizacaoId: string
): Promise<ResultadoGeracao> {
  const { inicio, fim } = obterLimitesSemana()
  const semanaInicioStr = formatarDateISO(inicio)
  const semanaFimStr = formatarDateISO(fim)

  // Verificar se ja existe resumo pra essa semana (idempotencia)
  const { data: existente } = await supabase
    .from("resumos_semanais")
    .select("id")
    .eq("organizacao_id", organizacaoId)
    .eq("semana_inicio", semanaInicioStr)
    .single()

  if (existente) {
    return { sucesso: true, motivo: "gerado" }
  }

  // Verificar limite de IA
  const org = await buscarOrganizacaoParaLimite(supabase, organizacaoId)
  if (org) {
    const limiteExcedido = await verificarLimiteIAComCliente(supabase, organizacaoId, org)
    if (!limiteExcedido.permitido) {
      return { sucesso: false, motivo: "limite_ia", erro: limiteExcedido.mensagem }
    }
  }

  // Coletar metricas
  const metricas = await coletarMetricasSemanais(supabase, organizacaoId, inicio, fim)

  const totalMovimentacoes =
    metricas.negocios.criados +
    metricas.negocios.ganhos +
    metricas.negocios.perdidos +
    metricas.clientes.novos +
    metricas.imoveis.cadastrados +
    metricas.imoveis.vendidos +
    metricas.imoveis.alugados +
    metricas.atividades.concluidas

  // Sem movimentacao: salvar resumo vazio (sem chamar OpenAI)
  if (totalMovimentacoes === 0) {
    const { data: resumoVazio, error } = await supabase
      .from("resumos_semanais")
      .insert({
        organizacao_id: organizacaoId,
        semana_inicio: semanaInicioStr,
        semana_fim: semanaFimStr,
        metricas,
        conteudo: "",
      })
      .select()
      .single()

    if (error) {
      // Unique constraint — ja foi gerado por outra execucao
      if (error.code === "23505") return { sucesso: true, motivo: "gerado" }
      return { sucesso: false, motivo: "erro", erro: error.message }
    }

    return {
      sucesso: true,
      motivo: "sem_dados",
      resumo: resumoVazio as unknown as ResumoSemanal,
    }
  }

  // Gerar com IA
  const prompt = `Você é um consultor de gestão imobiliária. Analise os dados da semana e gere um resumo executivo para o corretor.

DADOS DA SEMANA (${semanaInicioStr} a ${semanaFimStr}):

NEGÓCIOS:
- Criados: ${metricas.negocios.criados}
- Ganhos: ${metricas.negocios.ganhos} (${formatarPreco(metricas.negocios.valorGanho)})
- Perdidos: ${metricas.negocios.perdidos}

CLIENTES:
- Novos na semana: ${metricas.clientes.novos}
- Total na base: ${metricas.clientes.total}

IMÓVEIS:
- Cadastrados: ${metricas.imoveis.cadastrados}
- Vendidos: ${metricas.imoveis.vendidos}
- Alugados: ${metricas.imoveis.alugados}

ATIVIDADES:
- Concluídas: ${metricas.atividades.concluidas}
- Vencidas (atrasadas): ${metricas.atividades.vencidas}
- Pendentes: ${metricas.atividades.pendentes}

Responda em português brasileiro com exatamente 3 seções usando este formato:

**Destaques da semana**
- (2-3 bullets sobre o que foi positivo)

**Atenção**
- (2-3 bullets sobre o que precisa de cuidado imediato)

**Oportunidades**
- (2-3 bullets com sugestões práticas para a próxima semana)

Seja direto, prático e específico. Use os números. Não use jargão técnico.`

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    })

    const conteudo = resposta.choices[0]?.message?.content?.trim() || ""

    const { data: novoResumo, error } = await supabase
      .from("resumos_semanais")
      .insert({
        organizacao_id: organizacaoId,
        semana_inicio: semanaInicioStr,
        semana_fim: semanaFimStr,
        metricas,
        conteudo,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") return { sucesso: true, motivo: "gerado" }
      return { sucesso: false, motivo: "erro", erro: error.message }
    }

    // Registrar uso de IA
    await supabase.from("eventos_billing").insert({
      organizacao_id: organizacaoId,
      tipo_evento: "conversa_ia",
      payload: { timestamp: new Date().toISOString() },
    })

    return {
      sucesso: true,
      motivo: "gerado",
      resumo: novoResumo as unknown as ResumoSemanal,
    }
  } catch {
    return { sucesso: false, motivo: "erro", erro: "Erro ao chamar OpenAI" }
  }
}

// ============================================================
// Helpers internos de limite de IA
// ============================================================

async function buscarOrganizacaoParaLimite(supabase: SupabaseClient, organizacaoId: string) {
  const { data } = await supabase
    .from("organizacoes")
    .select("plano, plano_status, limites, trial_fim_em")
    .eq("id", organizacaoId)
    .single()

  return data as {
    plano: string
    plano_status: string
    limites: { max_conversas_ia_mes: number }
    trial_fim_em: string | null
  } | null
}

async function verificarLimiteIAComCliente(
  supabase: SupabaseClient,
  organizacaoId: string,
  org: { plano: string; plano_status: string; limites: { max_conversas_ia_mes: number }; trial_fim_em: string | null }
): Promise<{ permitido: boolean; mensagem?: string }> {
  // Trial expirado
  if (org.plano === "trial" && org.trial_fim_em) {
    const trialFim = new Date(org.trial_fim_em)
    if (trialFim < new Date()) {
      return { permitido: false, mensagem: "Trial expirado" }
    }
  }

  // Plano cancelado
  if (org.plano_status === "canceled") {
    return { permitido: false, mensagem: "Plano cancelado" }
  }

  // Contar uso do mes
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from("eventos_billing")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("tipo_evento", "conversa_ia")
    .gte("created_at", inicioMes.toISOString())

  const atual = count ?? 0
  const maximo = org.limites.max_conversas_ia_mes

  if (atual >= maximo) {
    return { permitido: false, mensagem: `Limite de ${maximo} conversas IA/mês atingido` }
  }

  return { permitido: true }
}
