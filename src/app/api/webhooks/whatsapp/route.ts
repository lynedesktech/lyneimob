import { after, NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { schemaPayloadUazapi } from "@/types/whatsapp"
import type { TipoConteudo, ConfigWhatsapp } from "@/types/whatsapp"
import { extrairNumero, ehGrupo, marcarComoLida } from "@/lib/whatsapp/uazapi"

// ============================================================
// Webhook WhatsApp — recebe mensagens da Uazapi
// ============================================================

// Permitir até 60s para o debounce (20s) + processamento de mídia + IA
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // LOG DIAGNÓSTICO — ver exatamente o que a Uazapi envia
    console.log("[WhatsApp Webhook] Recebido:", JSON.stringify(body))

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
    if (!config && instanceIdent?.startsWith("lyneimob-")) {
      const orgPrefix = instanceIdent.replace("lyneimob-", "")
      const { data } = await supabase
        .from("config_whatsapp")
        .select("*")
        .ilike("organizacao_id", `${orgPrefix}%`)
        .eq("ativo", true)
        .single()
      config = data
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
      await criarClienteENegocioInicial(supabase, organizacaoId, numeroCliente, conversaId, config)
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
          body: JSON.stringify({ conversaId, organizacaoId }),
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
 * Busca conversa existente ou cria uma nova.
 * Retorna o ID e se a conversa foi criada agora (isNova).
 */
async function buscarOuCriarConversa(
  supabase: ReturnType<typeof criarClienteAdmin>,
  organizacaoId: string,
  numeroCliente: string,
  nomeCliente: string | null
): Promise<{ id: string; isNova: boolean }> {
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
    return { id: conversaExistente.id, isNova: false }
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

  return { id: novaConversa.id, isNova: true }
}

/**
 * Cria cliente e negócio automaticamente no primeiro contato.
 * O cliente é criado sem nome (será preenchido pela IA quando souber).
 * O negócio é criado na etapa "Pré-atendimento IA".
 */
async function criarClienteENegocioInicial(
  supabase: ReturnType<typeof criarClienteAdmin>,
  organizacaoId: string,
  numeroCliente: string,
  conversaId: string,
  config: Record<string, unknown>
): Promise<void> {
  try {
    // Buscar etapa "Pré-atendimento IA"
    const { data: etapa } = await supabase
      .from("pipeline_etapas")
      .select("id")
      .eq("organizacao_id", organizacaoId)
      .eq("tipo", "pre_atendimento_ia")
      .single()

    if (!etapa) {
      console.error("[Webhook] Etapa pré-atendimento IA não encontrada para org:", organizacaoId)
      return
    }

    // Obter corretor: corretor padrão da config ou admin da org
    let corretorId = (config.corretor_padrao_id as string) || null
    if (!corretorId) {
      const { data: admin } = await supabase
        .from("usuarios")
        .select("id")
        .eq("organizacao_id", organizacaoId)
        .eq("cargo", "admin")
        .limit(1)
        .single()
      corretorId = admin?.id || null
    }

    if (!corretorId) {
      console.error("[Webhook] Nenhum corretor encontrado para org:", organizacaoId)
      return
    }

    // Verificar se já existe cliente com este número (cliente retornando após negócio anterior)
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("organizacao_id", organizacaoId)
      .or(`telefone.eq.${numeroCliente},whatsapp.eq.${numeroCliente}`)
      .limit(1)
      .single()

    let clienteId: string

    if (clienteExistente) {
      // Reusar cliente existente — ele já está cadastrado na plataforma
      clienteId = clienteExistente.id
      console.log(`[Webhook] Cliente existente reutilizado: ${clienteId}`)
    } else {
      // Criar cliente sem nome (será atualizado pela IA durante o atendimento)
      const { data: clienteNovo, error: erroCliente } = await supabase
        .from("clientes")
        .insert({
          organizacao_id: organizacaoId,
          corretor_id: corretorId,
          nome: "Contato WhatsApp",
          telefone: numeroCliente,
          whatsapp: numeroCliente,
          tipo: "comprador",
          origem: "whatsapp",
        })
        .select("id")
        .single()

      if (erroCliente || !clienteNovo) {
        console.error("[Webhook] Erro ao criar cliente inicial:", erroCliente?.message)
        return
      }
      clienteId = clienteNovo.id
    }

    // Calcular próxima posição na etapa
    const { data: ultimoNegocio } = await supabase
      .from("negocios")
      .select("posicao")
      .eq("etapa_id", etapa.id)
      .order("posicao", { ascending: false })
      .limit(1)
      .single()

    const posicao = (ultimoNegocio?.posicao ?? -1) + 1

    // Criar negócio na etapa pré-atendimento
    const { data: negocio, error: erroNegocio } = await supabase
      .from("negocios")
      .insert({
        organizacao_id: organizacaoId,
        corretor_id: corretorId,
        cliente_id: clienteId,
        etapa_id: etapa.id,
        titulo: "Atendimento WhatsApp",
        tipo: "venda",
        posicao,
      })
      .select("id")
      .single()

    if (erroNegocio || !negocio) {
      console.error("[Webhook] Erro ao criar negócio inicial:", erroNegocio?.message)
      return
    }

    // Vincular cliente e negócio à conversa
    await supabase
      .from("conversas_whatsapp")
      .update({
        cliente_id: clienteId,
        negocio_id: negocio.id,
      })
      .eq("id", conversaId)

    console.log(`[Webhook] Cliente ${clienteId} e negócio ${negocio.id} vinculados à conversa ${conversaId}`)

    // Detectar se este número tem lead de portal recente (últimos 30 dias)
    // Isso permite à IA saber o canal e adaptar o atendimento
    const { data: leadPortal } = await supabase
      .from("leads_portais")
      .select("portal, imovel_id")
      .eq("organizacao_id", organizacaoId)
      .eq("telefone", numeroCliente)
      .in("status", ["novo", "processado"])
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (leadPortal) {
      const origemLead = leadPortal.portal === "site" ? "site" : "portal"
      await supabase
        .from("conversas_whatsapp")
        .update({
          origem_lead: origemLead,
          ...(leadPortal.imovel_id ? { imovel_interesse_id: leadPortal.imovel_id } : {}),
        })
        .eq("id", conversaId)
      console.log(`[Webhook] Origem detectada: ${origemLead} | Imóvel: ${leadPortal.imovel_id ?? "nenhum"}`)
    }
  } catch (erro) {
    console.error("[Webhook] Erro ao criar cliente/negócio inicial:", erro instanceof Error ? erro.message : erro)
  }
}
