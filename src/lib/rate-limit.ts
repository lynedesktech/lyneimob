import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/redis"

/**
 * Rate limiter para chamadas à OpenAI por organização.
 * Limite: 60 chamadas por minuto por organização.
 * Usa sliding window para distribuição uniforme.
 */
export const rateLimitOpenAI = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "ratelimit:openai",
    })
  : null

/**
 * Verifica se a organização pode fazer mais chamadas à OpenAI.
 * Retorna { permitido, restante, resetEm }
 */
export async function verificarLimiteOpenAI(organizacaoId: string): Promise<{
  permitido: boolean
  restante: number
}> {
  if (!rateLimitOpenAI) return { permitido: true, restante: 999 }

  const resultado = await rateLimitOpenAI.limit(organizacaoId)
  return {
    permitido: resultado.success,
    restante: resultado.remaining,
  }
}
