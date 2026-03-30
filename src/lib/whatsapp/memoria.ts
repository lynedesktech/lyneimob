// ============================================================
// Memória de conversa com Redis + fallback para banco
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
  if (!redis) return // Sem Redis, mensagens já estão salvas no banco como fallback
  const chave = `${CHAVE_PREFIX}${conversaId}`

  const mensagem: MensagemMemoria = {
    papel,
    conteudo,
    timestamp: new Date().toISOString(),
  }

  try {
    await redis.rpush(chave, JSON.stringify(mensagem))
    await redis.ltrim(chave, -MAX_MENSAGENS, -1)
    await redis.expire(chave, TTL_SEGUNDOS)
  } catch (err) {
    console.warn("[Memória] Erro ao salvar no Redis, fallback para banco:", err instanceof Error ? err.message : err)
  }
}

/**
 * Busca memória da conversa — Redis primeiro, fallback para banco
 * Retorna array de mensagens ordenadas cronologicamente
 */
export async function buscarMemoria(
  conversaId: string
): Promise<Array<{ papel: "usuario" | "assistente"; conteudo: string }>> {
  // Tentar Redis primeiro
  try {
    const { redis } = await import("@/lib/redis")
    if (redis) {
      const chave = `${CHAVE_PREFIX}${conversaId}`
      const itens = await redis.lrange(chave, 0, -1)

      if (itens && itens.length > 0) {
        return itens.map((item) => {
          const mensagem = (typeof item === "string" ? JSON.parse(item) : item) as MensagemMemoria
          return { papel: mensagem.papel, conteudo: mensagem.conteudo }
        })
      }
    }
  } catch (err) {
    console.warn("[Memória] Redis indisponível, usando fallback do banco:", err instanceof Error ? err.message : err)
  }

  // Fallback: buscar mensagens do banco de dados
  try {
    const { criarClienteAdmin } = await import("@/lib/supabase/admin")
    const supabase = criarClienteAdmin()

    const { data: mensagens } = await supabase
      .from("mensagens_whatsapp")
      .select("direcao, conteudo")
      .eq("conversa_id", conversaId)
      .not("conteudo", "is", null)
      .order("criado_em", { ascending: true })
      .limit(MAX_MENSAGENS)

    if (!mensagens || mensagens.length === 0) return []

    return mensagens.map((m) => ({
      papel: (m.direcao === "recebida" ? "usuario" : "assistente") as "usuario" | "assistente",
      conteudo: m.conteudo || "",
    }))
  } catch {
    return []
  }
}

/**
 * Limpa memória de uma conversa
 */
export async function limparMemoria(conversaId: string): Promise<void> {
  try {
    const { redis } = await import("@/lib/redis")
    if (!redis) return
    const chave = `${CHAVE_PREFIX}${conversaId}`
    await redis.del(chave)
  } catch {
    // Ignorar erro na limpeza
  }
}
