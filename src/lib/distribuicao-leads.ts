import { criarClienteAdmin } from "@/lib/supabase/admin"
import type { ConfigDistribuicao } from "@/types/distribuicao-leads"

// ============================================================
// Distribuição de Leads entre Corretores
// Função central chamada por processarLead() e agente SDR
// ============================================================

type OpcoesDistribuicao = {
  corretorManualId?: string
}

/**
 * Retorna o ID do próximo corretor que deve receber o lead.
 * - Modo manual: retorna corretorManualId ou null (chamador usa fallback)
 * - Modo roleta: distribui em sequência entre corretores ativos
 * - Modo balanceamento: atribui ao corretor com menos negócios abertos
 */
export async function obterProximoCorretor(
  organizacaoId: string,
  opcoes?: OpcoesDistribuicao
): Promise<string | null> {
  const supabase = criarClienteAdmin()

  // Buscar configuração de distribuição da organização
  const { data: org } = await supabase
    .from("organizacoes")
    .select("config_distribuicao")
    .eq("id", organizacaoId)
    .single()

  const config = (org?.config_distribuicao as ConfigDistribuicao) || {
    modo: "manual",
    corretores_participantes: [],
    ultimo_corretor_index: 0,
  }

  // Modo manual: retorna o corretor que está processando (ou null para fallback)
  if (config.modo === "manual") {
    return opcoes?.corretorManualId || null
  }

  // Buscar corretores ativos da organização
  const corretoresAtivos = await buscarCorretoresAtivos(
    organizacaoId,
    config.corretores_participantes
  )

  if (corretoresAtivos.length === 0) {
    return opcoes?.corretorManualId || null
  }

  // Se só tem 1 corretor, retorna ele direto
  if (corretoresAtivos.length === 1) {
    return corretoresAtivos[0].id
  }

  if (config.modo === "roleta") {
    return distribuirPorRoleta(organizacaoId, corretoresAtivos, config)
  }

  if (config.modo === "balanceamento") {
    return distribuirPorBalanceamento(organizacaoId, corretoresAtivos)
  }

  return opcoes?.corretorManualId || null
}

// ============================================================
// Helpers internos
// ============================================================

type CorretorAtivo = {
  id: string
  nome: string
}

async function buscarCorretoresAtivos(
  organizacaoId: string,
  idsParticipantes: string[]
): Promise<CorretorAtivo[]> {
  const supabase = criarClienteAdmin()

  let query = supabase
    .from("usuarios")
    .select("id, nome")
    .eq("organizacao_id", organizacaoId)
    .eq("ativo", true)
    .order("nome", { ascending: true })

  // Se tem lista específica de participantes, filtrar por ela
  if (idsParticipantes.length > 0) {
    query = query.in("id", idsParticipantes)
  }

  const { data } = await query

  return data || []
}

/**
 * Roleta (round-robin): pega o próximo corretor na sequência
 * e atualiza o index no banco
 */
async function distribuirPorRoleta(
  organizacaoId: string,
  corretores: CorretorAtivo[],
  config: ConfigDistribuicao
): Promise<string> {
  const proximoIndex = (config.ultimo_corretor_index + 1) % corretores.length
  const corretorEscolhido = corretores[proximoIndex]

  // Atualizar index no banco para a próxima rodada
  const supabase = criarClienteAdmin()
  await supabase
    .from("organizacoes")
    .update({
      config_distribuicao: {
        ...config,
        ultimo_corretor_index: proximoIndex,
      },
    })
    .eq("id", organizacaoId)

  return corretorEscolhido.id
}

/**
 * Balanceamento: atribui ao corretor com menos negócios abertos
 */
async function distribuirPorBalanceamento(
  organizacaoId: string,
  corretores: CorretorAtivo[]
): Promise<string> {
  const supabase = criarClienteAdmin()

  // Contar negócios abertos por corretor
  const { data: negocios } = await supabase
    .from("negocios")
    .select("corretor_id")
    .eq("organizacao_id", organizacaoId)
    .eq("status", "aberto")

  // Montar mapa de carga
  const cargaPorCorretor: Record<string, number> = {}
  for (const corretor of corretores) {
    cargaPorCorretor[corretor.id] = 0
  }

  if (negocios) {
    for (const negocio of negocios) {
      if (cargaPorCorretor[negocio.corretor_id] !== undefined) {
        cargaPorCorretor[negocio.corretor_id]++
      }
    }
  }

  // Encontrar corretor com menor carga
  let menorCarga = Infinity
  let corretorEscolhido = corretores[0].id

  for (const corretor of corretores) {
    const carga = cargaPorCorretor[corretor.id]
    if (carga < menorCarga) {
      menorCarga = carga
      corretorEscolhido = corretor.id
    }
  }

  return corretorEscolhido
}
