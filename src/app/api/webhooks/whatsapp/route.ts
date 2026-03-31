import { after, NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { schemaPayloadUazapi } from "@/types/whatsapp"
import type { TipoConteudo, ConfigWhatsapp } from "@/types/whatsapp"
import { extrairNumero, ehGrupo, marcarComoLida } from "@/lib/whatsapp/uazapi"
import { buscarOuCriarConversa, criarClienteENegocioInicial } from "@/lib/whatsapp/conversa-utils"

// ============================================================
// Webhook WhatsApp — recebe mensagens da Uazapi
// ============================================================

// Permitir até 60s para o debounce (20s) + processamento de mídia + IA
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Log sem dados sensíveis (apenas tipo de evento)
    console.log("[WhatsApp Webhook] Evento recebido:", body.EventType || body.event || "desconhecido")

    // Checar tipo de evento ANTES de validar com Zod
    // A Uazapi envia "EventType" (com maiúsculas), não "event"
    const event =
      typeof body.EventType === "string"
        ? body.EventType
        : typeof body.event === "string"
          ? body.event
          : ""

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

    // Extrair dados do novo formato da Uazapi
    const messageData = payload.message
    if (!messageData) {
      return NextResponse.json({ status: "ignorado", motivo: "sem_conteudo" })
    }

    const remoteJid = messageData.chatid
    const fromMe = messageData.fromMe
    const messageId = messageData.messageid
    const pushName = messageData.senderName || payload.chat?.wa_contactName || null
    const instanceIdent = payload.instanceName || payload.instance

    // Ignorar mensagens do próprio bot
    if (fromMe) {
      return NextResponse.json({ status: "ignorado", motivo: "mensagem_propria" })
    }

    // Ignorar mensagens de grupo
    if (messageData.isGroup || ehGrupo(remoteJid)) {
      return NextResponse.json({ status: "ignorado", motivo: "grupo" })
    }

    const numeroCliente = extrairNumero(remoteJid)
    const supabase = criarClienteAdmin()

    // Identificar organização pela config do WhatsApp
    // Prioridade: token do payload > instance_id > orgPrefix do instanceName
    let config = null

    // 1. Buscar pelo token da instância (vem no root do payload, único por instância)
    const tokenPayload = body.token as string | undefined
    if (tokenPayload) {
      const { data } = await supabase
        .from("config_whatsapp")
        .select("*")
        .eq("uazapi_token", tokenPayload)
        .eq("ativo", true)
        .single()
      config = data
    }

    // 2. Fallback: buscar pelo instance_id
    if (!config && instanceIdent) {
      const { data } = await supabase
        .from("config_whatsapp")
        .select("*")
        .eq("instance_id", instanceIdent)
        .eq("ativo", true)
        .single()
      config = data
    }

    // 3. Fallback: extrair org do padrão "lyneimob-{orgPrefix}"
    // O orgPrefix é um UUID parcial (8 chars) — buscar orgs que começam com ele
    if (!config && instanceIdent?.startsWith("lyneimob-")) {
      const orgPrefix = instanceIdent.replace("lyneimob-", "")
      if (orgPrefix.length >= 8) {
        const { data: configs } = await supabase
          .from("config_whatsapp")
          .select("*")
          .eq("ativo", true)

        // Filtrar em JS para evitar ILIKE ambíguo
        config = configs?.find((c) => c.organizacao_id.startsWith(orgPrefix)) ?? null
      }
    }

    if (!config) {
      console.error("[WhatsApp Webhook] Config não encontrada para instance:", instanceIdent)
      return NextResponse.json(
        { erro: "Nenhuma configuração WhatsApp ativa encontrada" },
        { status: 404 }
      )
    }

    console.log("[WhatsApp Webhook] Config encontrada, org:", config.organizacao_id)

    const organizacaoId = config.organizacao_id

    // Detectar tipo de conteúdo e extrair texto
    const { tipo, conteudo } = detectarConteudo(messageData)

    // Buscar ou criar conversa
    const { id: conversaId, isNova } = await buscarOuCriarConversa(
      supabase,
      organizacaoId,
      numeroCliente,
      pushName
    )

    // Se conversa nova e agente está ativo → criar cliente + negócio automaticamente
    if (isNova && config.ativo) {
      // Usar pushName do WhatsApp como nome do contato; se vazio, formatar número como fallback
      const nomeContato = pushName || formatarNumeroFallback(numeroCliente)
      await criarClienteENegocioInicial(supabase, organizacaoId, numeroCliente, conversaId, config, {
        nomeCliente: nomeContato,
      })
    }

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
        message_id_whatsapp: messageId,
        metadata: messageData as unknown as Record<string, unknown>,
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

    // Marcar como lida no WhatsApp (usa o chatid completo, ex: "5511999999999@s.whatsapp.net")
    if (config.uazapi_token) {
      marcarComoLida(config as unknown as ConfigWhatsapp, remoteJid).catch((erro) => {
        console.error(
          `[WhatsApp Webhook] Erro ao marcar como lida (config: ${config.id}, instance: ${config.instance_id}):`,
          erro instanceof Error ? erro.message : erro
        )
      })
    }

    // Agendar debounce via endpoint separado (invocação serverless independente)
    // O after() só precisa sobreviver ~100ms pra enviar o fetch
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    after(async () => {
      try {
        await fetch(`${appUrl}/api/interno/processar-debounce`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
          body: JSON.stringify({ conversaId, organizacaoId, numeroCliente }),
        })
        console.log(`[Webhook] Debounce agendado para conversa ${conversaId}`)
      } catch (err) {
        console.error("[Webhook] Erro ao agendar debounce:", err instanceof Error ? err.message : err)
      }
    })

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
 * Detecta o tipo de conteúdo da mensagem pelo campo "type" da Uazapi
 */
function detectarConteudo(msg: {
  type?: string
  text?: string
  content?: string
  mediaType?: string
}): {
  tipo: TipoConteudo
  conteudo: string | null
} {
  const tipo = (msg.type || "").toLowerCase()
  const texto = msg.text || msg.content || null

  if (tipo === "text" || tipo === "conversation") return { tipo: "texto", conteudo: texto }
  if (tipo === "audio" || tipo === "audiomessage" || tipo === "ptt") return { tipo: "audio", conteudo: null }
  if (tipo === "image" || tipo === "imagemessage") return { tipo: "imagem", conteudo: texto }
  if (tipo === "document" || tipo === "documentmessage") return { tipo: "documento", conteudo: texto }
  if (tipo === "video" || tipo === "videomessage") return { tipo: "video", conteudo: texto }
  if (tipo === "sticker" || tipo === "stickermessage") return { tipo: "sticker", conteudo: null }
  if (tipo === "location" || tipo === "locationmessage") return { tipo: "localizacao", conteudo: texto }

  // Fallback: se tiver texto, trata como texto
  return { tipo: "texto", conteudo: texto }
}

/**
 * Formata número de telefone como fallback quando pushName não está disponível.
 * Ex: "5527997986566" → "+55 27 99798-6566"
 */
function formatarNumeroFallback(numero: string): string {
  // Espera formato "55DDNNNNNNNNN" (13 dígitos para celular)
  if (numero.startsWith("55") && numero.length >= 12) {
    const ddi = numero.slice(0, 2)
    const ddd = numero.slice(2, 4)
    const parte1 = numero.slice(4, 9)
    const parte2 = numero.slice(9)
    return `+${ddi} ${ddd} ${parte1}-${parte2}`
  }
  return `+${numero}`
}

// buscarOuCriarConversa e criarClienteENegocioInicial foram extraídas para
// @/lib/whatsapp/conversa-utils.ts (compartilhadas com mensagem-proativa)
