import type { ConfigWhatsapp, TipoConteudo } from "@/types/whatsapp"

// ============================================================
// Sistema de debounce com Redis (serverless-compatible)
// Agrupa mensagens em janela de 20s antes de enviar pra IA
// Evita que a IA responda cada mensagem separadamente
// quando o cliente manda várias seguidas
// ============================================================

const DEBOUNCE_MS = 20_000 // 20 segundos
const REDIS_TTL_S = 30 // TTL da chave Redis (margem de segurança)

/**
 * Agenda processamento da conversa com debounce via Redis.
 * Cada chamada registra seu timestamp no Redis. Após esperar DEBOUNCE_MS,
 * verifica se ainda é a última mensagem. Se sim, processa. Se não, ignora.
 *
 * Compatível com serverless (Vercel) — não usa setTimeout em memória nem Map.
 */
export async function agendarDebounce(
  conversaId: string,
  organizacaoId: string
): Promise<void> {
  const { redis } = await import("@/lib/redis")
  const chave = `debounce:whatsapp:${conversaId}`
  const meuTimestamp = Date.now().toString()

  if (redis) {
    // Registrar que esta mensagem chegou agora
    await redis.set(chave, meuTimestamp, { ex: REDIS_TTL_S })

    // Esperar o período de debounce
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS))

    // Verificar se ainda sou a última mensagem
    const timestampAtual = await redis.get(chave)
    if (timestampAtual !== meuTimestamp) {
      // Mensagem mais nova chegou — ela vai processar, eu ignoro
      console.log(`[Debounce] Conversa ${conversaId} — ignorando (mensagem mais nova existe)`)
      return
    }

    // Limpar flag do Redis
    await redis.del(chave)
  } else {
    // Fallback sem Redis: delay fixo de 5s (ambiente local sem Redis configurado)
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  // Processar mídia pendente + chamar agente
  console.log(`[Debounce] Processando lote da conversa ${conversaId}`)
  await processarLote(conversaId, organizacaoId)
}

// ============================================================
// Processamento do lote acumulado
// ============================================================

/**
 * Processa lote de mensagens acumuladas após o debounce:
 * 1. Busca mensagens de mídia não processadas da conversa
 * 2. Processa mídia (áudio → texto, imagem → descrição, PDF → texto)
 * 3. Atualiza conteúdo processado no banco
 * 4. Chama o agente IA para responder
 */
async function processarLote(
  conversaId: string,
  organizacaoId: string
): Promise<void> {
  try {
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
