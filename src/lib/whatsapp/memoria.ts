// ============================================================
// Memória de conversa com Redis
// Mantém contexto entre mensagens — janela de 30 mensagens, TTL 7 dias
// ============================================================

const CHAVE_PREFIX = "memoria:whatsapp:"
const MAX_MENSAGENS = 30
const TTL_SEGUNDOS = 604800 // 7 dias

type MensagemMemoria = {
  papel: "usuario" | "assistente"
  conteudo: string
  timestamp: string
}

/**
 * Salva uma mensagem na memória da conversa
 * Mantém apenas as últimas 30 mensagens (LTRIM)
 * Renova TTL a cada nova mensagem
 */
export async function salvarMensagemMemoria(
  conversaId: string,
  papel: "usuario" | "assistente",
  conteudo: string
): Promise<void> {
  const { redis } = await import("@/lib/redis")
  if (!redis) return
  const chave = `${CHAVE_PREFIX}${conversaId}`

  const mensagem: MensagemMemoria = {
    papel,
    conteudo,
    timestamp: new Date().toISOString(),
  }

  // Adicionar no final da lista
  await redis.rpush(chave, JSON.stringify(mensagem))

  // Manter apenas as últimas MAX_MENSAGENS
  await redis.ltrim(chave, -MAX_MENSAGENS, -1)

  // Renovar TTL
  await redis.expire(chave, TTL_SEGUNDOS)
}

/**
 * Busca memória da conversa no Redis
 * Retorna array de mensagens ordenadas cronologicamente
 */
export async function buscarMemoria(
  conversaId: string
): Promise<Array<{ papel: "usuario" | "assistente"; conteudo: string }>> {
  const { redis } = await import("@/lib/redis")
  if (!redis) return []
  const chave = `${CHAVE_PREFIX}${conversaId}`

  const itens = await redis.lrange(chave, 0, -1)

  if (!itens || itens.length === 0) {
    return []
  }

  return itens.map((item) => {
    const mensagem = (typeof item === "string" ? JSON.parse(item) : item) as MensagemMemoria
    return { papel: mensagem.papel, conteudo: mensagem.conteudo }
  })
}

/**
 * Limpa memória de uma conversa
 */
export async function limparMemoria(conversaId: string): Promise<void> {
  const { redis } = await import("@/lib/redis")
  if (!redis) return
  const chave = `${CHAVE_PREFIX}${conversaId}`
  await redis.del(chave)
}
