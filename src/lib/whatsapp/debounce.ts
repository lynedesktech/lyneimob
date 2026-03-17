import type { ConfigWhatsapp, TipoConteudo } from "@/types/whatsapp"

// ============================================================
// Sistema de debounce com Redis
// Agrupa mensagens em janela de 20s antes de enviar pra IA
// Evita que a IA responda cada mensagem separadamente
// quando o cliente manda várias seguidas
// ============================================================

const DEBOUNCE_MS = 20_000 // 20 segundos
const REDIS_TTL_S = 25 // 25 segundos (margem de segurança)

/**
 * Map em memória para controlar timers ativos por conversa
 * Cada conversa tem no máximo 1 timer ativo
 */
const timersAtivos = new Map<string, NodeJS.Timeout>()

/**
 * Adiciona conversa ao debounce
 * Se já tem timer ativo, cancela e reagenda (reinicia a janela)
 */
export function adicionarAoDebounce(
  conversaId: string,
  organizacaoId: string
): void {
  const chave = `debounce:whatsapp:${conversaId}`

  // Registrar no Redis que essa conversa tem mensagens pendentes
  import("@/lib/redis").then(({ redis }) => {
    if (!redis) return
    redis.set(chave, organizacaoId, { ex: REDIS_TTL_S }).catch((erro) => {
      console.error("[Debounce] Erro ao registrar no Redis:", erro instanceof Error ? erro.message : erro)
    })
  })

  // Cancelar timer anterior se existir
  const timerExistente = timersAtivos.get(conversaId)
  if (timerExistente) {
    clearTimeout(timerExistente)
  }

  // Agendar novo timer
  const novoTimer = setTimeout(() => {
    timersAtivos.delete(conversaId)
    processarLote(conversaId, organizacaoId).catch((erro) => {
      console.error(`[Debounce] Erro ao processar lote da conversa ${conversaId}:`, erro instanceof Error ? erro.message : erro)
    })
  }, DEBOUNCE_MS)

  timersAtivos.set(conversaId, novoTimer)
}

/**
 * Processa lote de mensagens acumuladas após o debounce
 * 1. Busca mensagens não processadas da conversa
 * 2. Processa mídia (áudio, imagem, PDF)
 * 3. Atualiza conteúdo processado no banco
 * 4. Chama o agente IA para responder
 */
async function processarLote(
  conversaId: string,
  organizacaoId: string
): Promise<void> {
  const chaveRedis = `debounce:whatsapp:${conversaId}`

  try {
    // Limpar flag do Redis
    const { redis } = await import("@/lib/redis")
    if (redis) await redis.del(chaveRedis)

    const { criarClienteAdmin } = await import("@/lib/supabase/admin")
    const supabase = criarClienteAdmin()

    // Buscar config do WhatsApp da organização
    const { data: config } = await supabase
      .from("config_whatsapp")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .eq("ativo", true)
      .single()

    if (!config) {
      console.error(`[Debounce] Config WhatsApp não encontrada para org ${organizacaoId}`)
      return
    }

    // Buscar mensagens recebidas não processadas da conversa
    // (conteudo_original é igual ao conteudo — significa que não foi processada ainda)
    const { data: mensagens } = await supabase
      .from("mensagens_whatsapp")
      .select("*")
      .eq("conversa_id", conversaId)
      .eq("direcao", "recebida")
      .not("tipo_conteudo", "eq", "texto") // Texto não precisa processar
      .order("criado_em", { ascending: true })

    if (!mensagens || mensagens.length === 0) {
      // Nenhuma mídia para processar — tudo era texto, chamar agente direto
      const { processarComAgente } = await import("./agente-sdr")
      await processarComAgente(conversaId, organizacaoId)
      return
    }

    // Processar mídia de cada mensagem que precisa
    for (const mensagem of mensagens) {
      // Pular se já foi processada (conteudo diferente do original)
      if (mensagem.conteudo !== mensagem.conteudo_original && mensagem.conteudo_original) {
        continue
      }

      // Pular se não tem message_id do WhatsApp (necessário pra baixar mídia)
      if (!mensagem.message_id_whatsapp) {
        continue
      }

      const nomeArquivo = (mensagem.metadata as Record<string, unknown>)
        ?.documentMessage
        ? ((mensagem.metadata as Record<string, unknown>).documentMessage as Record<string, unknown>)?.fileName as string | undefined
        : undefined

      const { processarConteudo } = await import("./processar-midia")
      const resultado = await processarConteudo(
        config as unknown as ConfigWhatsapp,
        mensagem.message_id_whatsapp,
        mensagem.tipo_conteudo as TipoConteudo,
        mensagem.conteudo,
        nomeArquivo
      )

      // Atualizar mensagem com conteúdo processado
      await supabase
        .from("mensagens_whatsapp")
        .update({
          conteudo: resultado.conteudo,
          metadata: {
            ...(mensagem.metadata as Record<string, unknown> || {}),
            ...(resultado.metadata || {}),
          },
        })
        .eq("id", mensagem.id)
    }

    // Chamar agente IA após processar todas as mídias
    const { processarComAgente } = await import("./agente-sdr")
    await processarComAgente(conversaId, organizacaoId)
  } catch (erro) {
    console.error(`[Debounce] Erro ao processar lote da conversa ${conversaId}:`, erro instanceof Error ? erro.message : erro)
  }
}
