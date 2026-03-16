"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import { openai } from "@/lib/openai"
import { verificarLimiteConversasIA, registrarUsoConversaIA } from "@/lib/verificar-limites"
import { formatarPreco } from "@/lib/formatadores"
import type { MetricasSemanais, ResumoSemanal } from "@/types/resumo-semanal"
import type { EstadoFormulario } from "@/types/formulario"

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

/** Retorna segunda-feira e domingo da semana atual */
function obterLimitesSemana(): { inicio: Date; fim: Date } {
  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0=dom, 1=seg, ..., 6=sab

  // Calcular segunda-feira (início da semana)
  const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana
  const segunda = new Date(hoje)
  segunda.setDate(hoje.getDate() + diffSegunda)
  segunda.setHours(0, 0, 0, 0)

  // Calcular domingo (fim da semana)
  const domingo = new Date(segunda)
  domingo.setDate(segunda.getDate() + 6)
  domingo.setHours(23, 59, 59, 999)

  return { inicio: segunda, fim: domingo }
}

/** Formata Date como 'YYYY-MM-DD' para campos date do Supabase */
function formatarDateISO(data: Date): string {
  return data.toISOString().split("T")[0]
}

// ============================================================
// Coletar métricas da semana
// ============================================================

async function coletarMetricasSemanais(
  organizacaoId: string,
  semanaInicio: Date,
  semanaFim: Date
): Promise<MetricasSemanais> {
  const supabase = await criarClienteServer()
  const inicioISO = semanaInicio.toISOString()
  const fimISO = semanaFim.toISOString()

  // Negócios criados na semana
  const { count: negociosCriados } = await supabase
    .from("negocios")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .gte("created_at", inicioISO)
    .lte("created_at", fimISO)

  // Negócios ganhos na semana
  const { data: negociosGanhos } = await supabase
    .from("negocios")
    .select("valor")
    .eq("organizacao_id", organizacaoId)
    .eq("status", "ganho")
    .gte("data_ganho", inicioISO)
    .lte("data_ganho", fimISO)

  const qtdGanhos = negociosGanhos?.length ?? 0
  const valorGanho = negociosGanhos?.reduce((acc, n) => acc + (n.valor ?? 0), 0) ?? 0

  // Negócios perdidos na semana
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

  // Imóveis cadastrados na semana
  const { count: imoveisCadastrados } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .gte("created_at", inicioISO)
    .lte("created_at", fimISO)

  // Imóveis vendidos na semana
  const { count: imoveisVendidos } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "vendido")
    .gte("updated_at", inicioISO)
    .lte("updated_at", fimISO)

  // Imóveis alugados na semana
  const { count: imoveisAlugados } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "alugado")
    .gte("updated_at", inicioISO)
    .lte("updated_at", fimISO)

  // Atividades concluídas na semana
  const { count: atividadesConcluidas } = await supabase
    .from("atividades")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "concluida")
    .gte("data_conclusao", inicioISO)
    .lte("data_conclusao", fimISO)

  // Atividades vencidas (pendentes com data_inicio no passado)
  const agora = new Date().toISOString()
  const { count: atividadesVencidas } = await supabase
    .from("atividades")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("status", "pendente")
    .lt("data_inicio", agora)

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
// Buscar ou gerar resumo semanal
// ============================================================

export async function buscarOuGerarResumoSemanal(): Promise<
  EstadoFormulario & { resumo?: ResumoSemanal }
> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const { inicio, fim } = obterLimitesSemana()
  const semanaInicioStr = formatarDateISO(inicio)
  const semanaFimStr = formatarDateISO(fim)

  const supabase = await criarClienteServer()

  // Verificar se já existe resumo pra essa semana
  const { data: resumoExistente } = await supabase
    .from("resumos_semanais")
    .select("*")
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("semana_inicio", semanaInicioStr)
    .single()

  if (resumoExistente) {
    return {
      sucesso: "Resumo carregado",
      resumo: resumoExistente as unknown as ResumoSemanal,
    }
  }

  // Verificar limite de IA antes de gerar
  const limite = await verificarLimiteConversasIA(usuario.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  // Coletar métricas
  const metricas = await coletarMetricasSemanais(usuario.organizacao_id, inicio, fim)

  // Verificar se tem dados suficientes
  const totalMovimentacoes =
    metricas.negocios.criados +
    metricas.negocios.ganhos +
    metricas.negocios.perdidos +
    metricas.clientes.novos +
    metricas.imoveis.cadastrados +
    metricas.imoveis.vendidos +
    metricas.imoveis.alugados +
    metricas.atividades.concluidas

  if (totalMovimentacoes === 0) {
    return {
      sucesso: "Semana sem movimentações",
      resumo: {
        id: "",
        organizacao_id: usuario.organizacao_id,
        semana_inicio: semanaInicioStr,
        semana_fim: semanaFimStr,
        metricas,
        conteudo: "",
        created_at: new Date().toISOString(),
      },
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
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    })

    const conteudo = resposta.choices[0]?.message?.content?.trim() || ""

    // Salvar no banco
    const { data: novoResumo, error } = await supabase
      .from("resumos_semanais")
      .insert({
        organizacao_id: usuario.organizacao_id,
        semana_inicio: semanaInicioStr,
        semana_fim: semanaFimStr,
        metricas,
        conteudo,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao salvar resumo semanal:", error.message)
      return { erro: "Erro ao salvar o resumo. Tente novamente." }
    }

    await registrarUsoConversaIA(usuario.organizacao_id)

    return {
      sucesso: "Resumo gerado com sucesso",
      resumo: novoResumo as unknown as ResumoSemanal,
    }
  } catch {
    return { erro: "Erro ao gerar resumo. Verifique a chave da OpenAI." }
  }
}

// ============================================================
// Regenerar resumo (deleta o atual e gera novo)
// ============================================================

export async function regenerarResumoSemanal(): Promise<
  EstadoFormulario & { resumo?: ResumoSemanal }
> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const { inicio } = obterLimitesSemana()
  const semanaInicioStr = formatarDateISO(inicio)

  const supabase = await criarClienteServer()

  // Deletar resumo existente da semana
  await supabase
    .from("resumos_semanais")
    .delete()
    .eq("organizacao_id", usuario.organizacao_id)
    .eq("semana_inicio", semanaInicioStr)

  // Gerar novo
  return buscarOuGerarResumoSemanal()
}
