import { criarClienteServer } from "@/lib/supabase/server"
import { planoPermiteModulo } from "@/types/billing"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { TipoPlano, LimitesPlano, ResultadoLimite } from "@/types/billing"

// ============================================================
// Funções de verificação de limites por plano
// Usadas nas Server Actions antes de criar recursos
// ============================================================

async function buscarOrganizacao(organizacaoId: string, clienteExterno?: SupabaseClient) {
  const supabase = clienteExterno ?? await criarClienteServer()

  const { data } = await supabase
    .from("organizacoes")
    .select("plano, plano_status, limites, trial_fim_em")
    .eq("id", organizacaoId)
    .single()

  return data as {
    plano: TipoPlano
    plano_status: string
    limites: LimitesPlano
    trial_fim_em: string | null
  } | null
}

// ============================================================
// Verificar se o trial está ativo
// ============================================================

export async function verificarTrialAtivo(
  organizacaoId: string,
  clienteExterno?: SupabaseClient
): Promise<ResultadoLimite> {
  const org = await buscarOrganizacao(organizacaoId, clienteExterno)
  if (!org) {
    return { permitido: false, mensagem: "Organização não encontrada." }
  }

  // Se não é trial, não precisa verificar
  if (org.plano !== "trial") {
    return { permitido: true }
  }

  // Se é trial e tem data de expiração
  if (org.trial_fim_em) {
    const trialFim = new Date(org.trial_fim_em)
    if (trialFim < new Date()) {
      return {
        permitido: false,
        mensagem:
          "Seu período de teste expirou. Assine um plano para continuar usando o LyneImob.",
      }
    }
  }

  // Se plano está cancelado
  if (org.plano_status === "canceled") {
    return {
      permitido: false,
      mensagem:
        "Sua assinatura foi cancelada. Assine novamente para continuar.",
    }
  }

  return { permitido: true }
}

// ============================================================
// Verificar limite de imóveis
// ============================================================

export async function verificarLimiteImoveis(
  organizacaoId: string
): Promise<ResultadoLimite> {
  // Primeiro verificar trial
  const trial = await verificarTrialAtivo(organizacaoId)
  if (!trial.permitido) return trial

  const org = await buscarOrganizacao(organizacaoId)
  if (!org) {
    return { permitido: false, mensagem: "Organização não encontrada." }
  }

  const supabase = await criarClienteServer()

  // Contar imóveis ativos da organização
  const { count } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .neq("status", "inativo")

  const atual = count ?? 0
  const maximo = org.limites.max_imoveis

  if (atual >= maximo) {
    return {
      permitido: false,
      mensagem: `Você atingiu o limite de ${maximo} imóveis do seu plano. Faça upgrade para cadastrar mais.`,
      limite_atual: atual,
      limite_max: maximo,
    }
  }

  return { permitido: true, limite_atual: atual, limite_max: maximo }
}

// ============================================================
// Verificar limite de corretores
// ============================================================

export async function verificarLimiteCorretores(
  organizacaoId: string
): Promise<ResultadoLimite> {
  const trial = await verificarTrialAtivo(organizacaoId)
  if (!trial.permitido) return trial

  const org = await buscarOrganizacao(organizacaoId)
  if (!org) {
    return { permitido: false, mensagem: "Organização não encontrada." }
  }

  const supabase = await criarClienteServer()

  const { count } = await supabase
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)
    .eq("ativo", true)

  const atual = count ?? 0
  const maximo = org.limites.max_corretores

  if (atual >= maximo) {
    return {
      permitido: false,
      mensagem: `Você atingiu o limite de ${maximo} corretores do seu plano. Faça upgrade para adicionar mais.`,
      limite_atual: atual,
      limite_max: maximo,
    }
  }

  return { permitido: true, limite_atual: atual, limite_max: maximo }
}

// ============================================================
// Verificar limite de loteamentos
// ============================================================

export async function verificarLimiteLoteamentos(
  organizacaoId: string
): Promise<ResultadoLimite> {
  const trial = await verificarTrialAtivo(organizacaoId)
  if (!trial.permitido) return trial

  const org = await buscarOrganizacao(organizacaoId)
  if (!org) {
    return { permitido: false, mensagem: "Organização não encontrada." }
  }

  const supabase = await criarClienteServer()

  const { count } = await supabase
    .from("loteamentos")
    .select("id", { count: "exact", head: true })
    .eq("organizacao_id", organizacaoId)

  const atual = count ?? 0
  const maximo = org.limites.max_loteamentos

  if (atual >= maximo) {
    return {
      permitido: false,
      mensagem: `Você atingiu o limite de ${maximo} loteamento${maximo > 1 ? "s" : ""} do seu plano. Faça upgrade para cadastrar mais.`,
      limite_atual: atual,
      limite_max: maximo,
    }
  }

  return { permitido: true, limite_atual: atual, limite_max: maximo }
}

// ============================================================
// Verificar limite de conversas IA por mês
// ============================================================

export async function verificarLimiteConversasIA(
  organizacaoId: string,
  clienteExterno?: SupabaseClient
): Promise<ResultadoLimite> {
  const trial = await verificarTrialAtivo(organizacaoId, clienteExterno)
  if (!trial.permitido) return trial

  const org = await buscarOrganizacao(organizacaoId, clienteExterno)
  if (!org) {
    return { permitido: false, mensagem: "Organização não encontrada." }
  }

  const supabase = clienteExterno ?? await criarClienteServer()

  // Contar eventos de billing do tipo "conversa_ia" no mês atual
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
    return {
      permitido: false,
      mensagem: `Você atingiu o limite de ${maximo} conversas IA por mês do seu plano. Faça upgrade para mais.`,
      limite_atual: atual,
      limite_max: maximo,
    }
  }

  return { permitido: true, limite_atual: atual, limite_max: maximo }
}

// ============================================================
// Registrar uso de conversa IA (para contagem)
// ============================================================

export async function registrarUsoConversaIA(
  organizacaoId: string,
  clienteExterno?: SupabaseClient
): Promise<void> {
  const supabase = clienteExterno ?? await criarClienteServer()

  await supabase.from("eventos_billing").insert({
    organizacao_id: organizacaoId,
    tipo_evento: "conversa_ia",
    payload: { timestamp: new Date().toISOString() },
  })
}

// ============================================================
// Verificar acesso a módulo (feature gating)
// ============================================================

export async function verificarAcessoModulo(
  organizacaoId: string,
  modulo: string
): Promise<ResultadoLimite> {
  const trial = await verificarTrialAtivo(organizacaoId)
  if (!trial.permitido) return trial

  const org = await buscarOrganizacao(organizacaoId)
  if (!org) {
    return { permitido: false, mensagem: "Organização não encontrada." }
  }

  if (!planoPermiteModulo(org.plano, modulo)) {
    return {
      permitido: false,
      mensagem: `O módulo "${modulo}" não está disponível no seu plano. Faça upgrade para o plano Completo.`,
    }
  }

  return { permitido: true }
}
