import { after, NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { schemaPayloadUazapi } from "@/types/whatsapp"
import type { TipoConteudo } from "@/types/whatsapp"
import { extrairNumero, ehGrupo, marcarComoLida } from "@/lib/whatsapp/uazapi"

// ============================================================
// Webhook WhatsApp — recebe mensagens da Uazapi
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // LOG DIAGNÓSTICO — ver exatamente o que a Uazapi envia
    console.log("[WhatsApp Webhook] Recebido:", JSON.stringify(body))

    // Checar tipo de evento ANTES de validar com Zod
    // Eventos de conexão têm estrutura diferente (sem data.key) e causariam falha no Zod
    const event = typeof body.event === "string" ? body.event : ""
    if (!event.startsWith("messages")) {
      console.log("[WhatsApp Webhook] Ignorado — evento:", event)
      return NextResponse.json({ status: "ignorado", motivo: "evento_nao_mensagem" })
    }

    console.log("[WhatsApp Webhook] Evento aceito:", event)

    // Validar payload com Zod (só chega aqui se for evento de mensagem)
    const resultado = schemaPayloadUazapi.safeParse(body)
    if (!resultado.success) {
      console.error("[WhatsApp Webhook] Zod falhou:", JSON.stringify(resultado.error.issues))
      return NextResponse.json(
        { erro: "Payload inválido" },
        { status: 400 }
      )
    }

    console.log("[WhatsApp Webhook] Zod OK, processando...")

    const payload = resultado.data

    // Aceitar messages.upsert e também eventos genéricos "messages"
    if (payload.event !== "messages.upsert" && payload.event !== "messages") {
      console.log("[WhatsApp Webhook] Ignorado pós-Zod — evento:", payload.event)
      return NextResponse.json({ status: "ignorado", motivo: "evento_nao_mensagem" })
    }

    const { key, pushName, message } = payload.data

    // Ignorar mensagens do próprio bot
    if (key.fromMe) {
      return NextResponse.json({ status: "ignorado", motivo: "mensagem_propria" })
    }

    // Ignorar mensagens de grupo
    if (ehGrupo(key.remoteJid)) {
      return NextResponse.json({ status: "ignorado", motivo: "grupo" })
    }

    // Ignorar se não tem conteúdo de mensagem
    if (!message) {
      return NextResponse.json({ status: "ignorado", motivo: "sem_conteudo" })
    }

    const numeroCliente = extrairNumero(key.remoteJid)
    const supabase = criarClienteAdmin()

    // Identificar organização pela config do WhatsApp
    // Tenta buscar pelo instance_id do payload, depois fallback por ativo
    let config = null

    if (payload.instance) {
      const { data } = await supabase
        .from("config_whatsapp")
        .select("*")
        .eq("instance_id", payload.instance)
        .eq("ativo", true)
        .single()
      config = data
    }

    // Fallback: buscar por qualquer config ativa (compatibilidade)
    if (!config) {
      const { data } = await supabase
        .from("config_whatsapp")
        .select("*")
        .eq("ativo", true)
        .limit(1)
        .single()
      config = data
    }

    if (!config) {
      console.error("[WhatsApp Webhook] Config não encontrada para instance:", payload.instance)
      return NextResponse.json(
        { erro: "Nenhuma configuração WhatsApp ativa encontrada" },
        { status: 404 }
      )
    }

    console.log("[WhatsApp Webhook] Config encontrada, org:", config.organizacao_id)

    const organizacaoId = config.organizacao_id

    // Detectar tipo de conteúdo e extrair texto
    const { tipo, conteudo } = detectarConteudo(message)

    // Buscar ou criar conversa
    const conversaId = await buscarOuCriarConversa(
      supabase,
      organizacaoId,
      numeroCliente,
      pushName || null
    )

    // Salvar mensagem no banco (com dedup pelo message_id_whatsapp)
    const { data: mensagem, error: erroMensagem } = await supabase
      .from("mensagens_whatsapp")
      .insert({
        conversa_id: conversaId,
        organizacao_id: organizacaoId,
        direcao: "recebida" as const,
        tipo_conteudo: tipo,
        conteudo: conteudo,
        conteudo_original: conteudo,
        message_id_whatsapp: key.id,
        metadata: message as unknown as Record<string, unknown>,
      })
      .select("id")
      .single()

    if (erroMensagem) {
      // Se for erro de duplicata (unique constraint no message_id_whatsapp), ignorar
      if (erroMensagem.code === "23505") {
        return NextResponse.json({ status: "ignorado", motivo: "duplicata" })
      }
      console.error("[WhatsApp Webhook] Erro ao salvar mensagem:", erroMensagem.message)
      return NextResponse.json(
        { erro: "Erro ao salvar mensagem" },
        { status: 500 }
      )
    }

    // Atualizar última mensagem da conversa
    await supabase
      .from("conversas_whatsapp")
      .update({
        ultima_mensagem_em: new Date().toISOString(),
        nome_cliente: pushName || undefined,
      })
      .eq("id", conversaId)

    // Marcar como lida no WhatsApp
    marcarComoLida(config, key.id).catch((erro) => {
      console.error("[WhatsApp Webhook] Erro ao marcar como lida:", erro instanceof Error ? erro.message : erro)
    })

    // Processar com agente IA após retornar resposta
    // Usa after() do Next.js para manter a função viva no Vercel (serverless-compatible)
    const { processarComAgente } = await import("@/lib/whatsapp/agente-sdr")
    after(() =>
      processarComAgente(conversaId, organizacaoId).catch((err) =>
        console.error("[Webhook] Erro ao processar agente:", err instanceof Error ? err.message : err)
      )
    )

    return NextResponse.json({
      status: "ok",
      conversa_id: conversaId,
      mensagem_id: mensagem.id,
    })
  } catch (erro) {
    console.error("[WhatsApp Webhook] Erro geral:", erro instanceof Error ? erro.message : erro)
    return NextResponse.json(
      { erro: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}

// ============================================================
// Funções auxiliares
// ============================================================

/**
 * Detecta o tipo de conteúdo da mensagem e extrai o texto quando possível
 */
function detectarConteudo(message: Record<string, unknown>): {
  tipo: TipoConteudo
  conteudo: string | null
} {
  const msg = message as {
    conversation?: string
    extendedTextMessage?: { text?: string }
    imageMessage?: { caption?: string }
    audioMessage?: Record<string, unknown>
    documentMessage?: { fileName?: string }
    videoMessage?: { caption?: string }
    stickerMessage?: Record<string, unknown>
    locationMessage?: { degreesLatitude?: number; degreesLongitude?: number }
  }

  // Texto simples
  if (msg.conversation) {
    return { tipo: "texto", conteudo: msg.conversation }
  }

  // Texto com formatação/citação
  if (msg.extendedTextMessage?.text) {
    return { tipo: "texto", conteudo: msg.extendedTextMessage.text }
  }

  // Imagem (pode ter legenda)
  if (msg.imageMessage) {
    return { tipo: "imagem", conteudo: msg.imageMessage.caption || null }
  }

  // Áudio
  if (msg.audioMessage) {
    return { tipo: "audio", conteudo: null }
  }

  // Documento (PDF, etc)
  if (msg.documentMessage) {
    return { tipo: "documento", conteudo: msg.documentMessage.fileName || null }
  }

  // Vídeo
  if (msg.videoMessage) {
    return { tipo: "video", conteudo: msg.videoMessage.caption || null }
  }

  // Sticker
  if (msg.stickerMessage) {
    return { tipo: "sticker", conteudo: null }
  }

  // Localização
  if (msg.locationMessage) {
    const lat = msg.locationMessage.degreesLatitude
    const lng = msg.locationMessage.degreesLongitude
    return {
      tipo: "localizacao",
      conteudo: lat && lng ? `Localização: ${lat}, ${lng}` : null,
    }
  }

  // Fallback: texto desconhecido
  return { tipo: "texto", conteudo: null }
}

/**
 * Busca conversa existente ou cria uma nova
 */
async function buscarOuCriarConversa(
  supabase: ReturnType<typeof criarClienteAdmin>,
  organizacaoId: string,
  numeroCliente: string,
  nomeCliente: string | null
): Promise<string> {
  // Buscar conversa ativa (não arquivada/finalizada) com esse número
  const { data: conversaExistente } = await supabase
    .from("conversas_whatsapp")
    .select("id")
    .eq("organizacao_id", organizacaoId)
    .eq("numero_cliente", numeroCliente)
    .in("status", ["em_andamento", "qualificado", "encaminhado"])
    .order("criado_em", { ascending: false })
    .limit(1)
    .single()

  if (conversaExistente) {
    return conversaExistente.id
  }

  // Criar nova conversa
  const { data: novaConversa, error: erroConversa } = await supabase
    .from("conversas_whatsapp")
    .insert({
      organizacao_id: organizacaoId,
      numero_cliente: numeroCliente,
      nome_cliente: nomeCliente,
      status: "em_andamento",
      ultima_mensagem_em: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (erroConversa || !novaConversa) {
    throw new Error(`Erro ao criar conversa: ${erroConversa?.message}`)
  }

  return novaConversa.id
}
