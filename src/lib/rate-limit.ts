import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/redis"

/**
 * Rate limiter para chamadas à IA (Anthropic/OpenAI) por organização.
 * Limite: 60 chamadas por minuto por organização.
 * Usa sliding window para distribuição uniforme.
 */
export const rateLimitIA = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "ratelimit:ia",
    })
  : null

/**
 * Verifica se a organização pode fazer mais chamadas à IA.
 * Retorna { permitido, restante }
 */
export async function verificarLimiteIA(organizacaoId: string): Promise<{
  permitido: boolean
  restante: number
}> {
  if (!rateLimitIA) return { permitido: true, restante: 999 }

  const resultado = await rateLimitIA.limit(organizacaoId)
  return {
    permitido: resultado.success,
    restante: resultado.remaining,
  }
}

// Alias retrocompatível enquanto outros arquivos referem ao nome antigo
export const verificarLimiteOpenAI = verificarLimiteIA
export const rateLimitOpenAI = rateLimitIA
