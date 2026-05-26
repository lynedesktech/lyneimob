import Anthropic from "@anthropic-ai/sdk"

// ============================================================
// Cliente Anthropic (Claude) — usado no agente SDR
// Roteamento dinâmico: Haiku 4.5 padrão, Sonnet 4.6 quando precisar
// ============================================================

let _anthropic: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

export type ModeloClaude = "claude-haiku-4-5" | "claude-sonnet-4-6"

export type ContextoRoteamento = {
  /** Conta de turnos da conversa (mensagens user/assistant somadas) */
  numTurnos: number
  /** Última mensagem do usuário contém imagem (vision) */
  ultimaMensagemTemImagem: boolean
  /** Conversa já usou tool e errou (forçando reescalada) */
  toolErrouAntes: boolean
  /** Usuário pediu negociação complexa, agendamento, ou múltiplas tools encadeadas */
  fluxoComplexo: boolean
}

/**
 * Escolhe modelo Claude com base no contexto da conversa.
 *
 * Heurística:
 * - Vision (imagem) → Sonnet 4.6 (analise melhor)
 * - Conversa longa (>10 turnos) → Sonnet 4.6 (mais nuance)
 * - Tool errou antes → Sonnet 4.6 (escala pra resolver)
 * - Fluxo complexo (agendar visita, qualificar e encaminhar) → Sonnet 4.6
 * - Caso padrão → Haiku 4.5 (rápido e barato)
 *
 * IMPORTANTE: o modelo é escolhido no INÍCIO da conversa. Trocar
 * modelo no meio invalida o prompt cache.
 */
export function escolherModelo(ctx: ContextoRoteamento): ModeloClaude {
  if (ctx.ultimaMensagemTemImagem) return "claude-sonnet-4-6"
  if (ctx.toolErrouAntes) return "claude-sonnet-4-6"
  if (ctx.fluxoComplexo) return "claude-sonnet-4-6"
  if (ctx.numTurnos > 10) return "claude-sonnet-4-6"
  return "claude-haiku-4-5"
}

/**
 * Heurística leve pra detectar fluxo complexo a partir do texto.
 * Roda sobre as últimas N mensagens do usuário.
 */
export function detectarFluxoComplexo(textos: string[]): boolean {
  const corpus = textos.join(" ").toLowerCase()
  const sinais = [
    "agendar", "agendamento", "visita", "visitar",
    "marcar", "horario", "horário",
    "negociar", "negociação", "proposta", "financiamento",
    "documento", "contrato", "comprar agora",
    "falar com", "atendente", "corretor",
  ]
  return sinais.some((s) => corpus.includes(s))
}
