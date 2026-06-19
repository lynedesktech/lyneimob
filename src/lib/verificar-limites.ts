import { criarClienteServer } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { MODO_PRODUTO_UNICO } from "@/lib/produto"

// ============================================================
// Verificacoes de limite por plano (legado SaaS)
// Em modo produto unico (Duna), todas as funcoes liberam — nao ha
// mais planos/quotas. Mantemos as funcoes pra nao quebrar os 10
// callsites espalhados (ia-*, imoveis, loteamentos, usuarios, etc).
//
// `registrarUsoConversaIA` continua funcionando — eh util pra ter
// historico de uso de IA mesmo sem billing.
// ============================================================

export type ResultadoLimite = {
  permitido: boolean
  mensagem?: string
  limite_atual?: number
  limite_max?: number
}

const LIBERADO: ResultadoLimite = { permitido: true }

export async function verificarTrialAtivo(): Promise<ResultadoLimite> {
  if (MODO_PRODUTO_UNICO) return LIBERADO
  return LIBERADO
}

// O parametro _organizacaoId e aceito (e ignorado) so pra manter compatibilidade
// com os callsites herdados da fase SaaS. Em modo produto unico tudo libera.
export async function verificarLimiteImoveis(_organizacaoId?: string): Promise<ResultadoLimite> {
  return LIBERADO
}

export async function verificarLimiteCorretores(_organizacaoId?: string): Promise<ResultadoLimite> {
  return LIBERADO
}

export async function verificarLimiteLoteamentos(_organizacaoId?: string): Promise<ResultadoLimite> {
  return LIBERADO
}

export async function verificarLimiteConversasIA(_organizacaoId?: string): Promise<ResultadoLimite> {
  return LIBERADO
}

export async function verificarAcessoModulo(): Promise<ResultadoLimite> {
  return LIBERADO
}

/**
 * Registra uso de conversa IA na tabela eventos_billing.
 * Util pra ter historico mesmo sem billing ativo.
 */
export async function registrarUsoConversaIA(
  organizacaoId: string,
  clienteExterno?: SupabaseClient
): Promise<void> {
  const supabase = clienteExterno ?? (await criarClienteServer())
  await supabase.from("eventos_billing").insert({
    organizacao_id: organizacaoId,
    tipo_evento: "conversa_ia",
    payload: { timestamp: new Date().toISOString() },
  })
}
