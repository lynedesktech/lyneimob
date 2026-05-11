// ============================================================
// LYNEDES-103 Sprint 2 — Toggle global da IA + bloqueio por contato
// Espelho TS das funcoes que ja existem no agente Python (Railway)
// As mesmas chaves Redis sao compartilhadas entre TS e Python
// ============================================================

import { redis } from "@/lib/redis"

const AI_GLOBAL_KEY = "ai:global:enabled"
const BLOCK_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 dias

/**
 * Verifica se a IA esta habilitada globalmente.
 * Default: true (se chave nao existe).
 */
export async function isIAGlobalEnabled(): Promise<boolean> {
  if (!redis) return true
  const val = await redis.get(AI_GLOBAL_KEY)
  if (val === null || val === undefined) return true
  return val === "1" || val === 1
}

/**
 * Liga/desliga a IA globalmente.
 * Quando false, NENHUMA mensagem e processada pela IA.
 */
export async function setIAGlobal(enabled: boolean): Promise<void> {
  if (!redis) return
  await redis.set(AI_GLOBAL_KEY, enabled ? "1" : "0")
}

/**
 * Verifica se um contato especifico esta bloqueado para IA.
 * Usado quando corretor responde manualmente — IA nao deve responder em cima.
 */
export async function isContactBlocked(
  chatId: string,
  orgId: string
): Promise<boolean> {
  if (!redis) return false
  const key = `${chatId}_timeout_${orgId}`
  const val = await redis.get(key)
  return val !== null && val !== undefined && val !== ""
}

/**
 * Bloqueia IA para um contato especifico (TTL 30 dias).
 * Chamado automaticamente quando humano responde manualmente.
 */
export async function setContactBlock(
  chatId: string,
  orgId: string
): Promise<void> {
  if (!redis) return
  const key = `${chatId}_timeout_${orgId}`
  await redis.set(key, "true", { ex: BLOCK_TTL_SECONDS })
}

/**
 * Remove bloqueio de um contato (libera IA pra responder de novo).
 */
export async function removeContactBlock(
  chatId: string,
  orgId: string
): Promise<void> {
  if (!redis) return
  await redis.del(`${chatId}_timeout_${orgId}`)
}
