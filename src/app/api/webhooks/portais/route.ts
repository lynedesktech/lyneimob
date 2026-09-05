import { after, NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { normalizarLead, leadTemDadosMinimos } from "@/lib/leads/normalizador"

// ============================================================
// Codigos de erro padronizados — clientes integradores podem
// usar pra distinguir falhas sem parsear strings em portugues
// ============================================================

type ErrorCode =
  | "payload_invalido"
  | "org_nao_identificada"
  | "org_nao_encontrada"
  | "lead_sem_dados_minimos"
  | "erro_salvar_lead"
  | "erro_interno"
  | "segredo_ausente"
  | "segredo_invalido"

/**
 * Compara dois segredos em tempo constante.
 *
 * Evita que a diferença de tempo entre uma comparação que falha no primeiro
 * caractere e outra que falha no último permita descobrir o segredo aos poucos.
 */
function segredosConferem(recebido: string, esperado: string): boolean {
  if (recebido.length !== esperado.length) return false
  let diferenca = 0
  for (let i = 0; i < recebido.length; i++) {
    diferenca |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i)
  }
  return diferenca === 0
}

export async function POST(request: Request) {
  const inicio = Date.now()
  let organizacaoId: string | undefined
  let portal: string | undefined

  function logChamada(status: number, errorCode?: ErrorCode) {
    const log = {
      status,
      duracao_ms: Date.now() - inicio,
      organizacao_id: organizacaoId,
      portal,
      error_code: errorCode,
    }
    if (status >= 500) console.error("[Portais Webhook] requisicao", log)
    else if (status >= 400) console.warn("[Portais Webhook] requisicao", log)
    else console.log("[Portais Webhook] requisicao", log)
  }

  function responder(
    status: number,
    body: { error_code?: ErrorCode } & Record<string, unknown>
  ) {
    logChamada(status, body.error_code)
    return NextResponse.json(body, { status })
  }

  try {
    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return responder(400, {
        error_code: "payload_invalido",
        erro: "Payload JSON invalido",
      })
    }

    if (!payload || typeof payload !== "object") {
      return responder(400, {
        error_code: "payload_invalido",
        erro: "Payload invalido",
      })
    }

    const payloadObj = payload as Record<string, unknown>

    // A organizacao de destino vem do SEGREDO, nunca do corpo da requisicao.
    //
    // Antes ela era lida de org_slug/org_id/empresa_id — campos que quem chama
    // escreve à vontade, e o slug é público (é o endereço do site). Isso
    // permitia injetar leads no CRM de qualquer imobiliária e, pior, fazer o
    // WhatsApp dela mandar mensagem para um número escolhido pelo atacante,
    // porque a rota dispara mensagem proativa quando há telefone no payload.
    const url = new URL(request.url)
    const segredo =
      request.headers.get("x-webhook-secret") ||
      url.searchParams.get("token") ||
      ""

    if (!segredo) {
      return responder(401, {
        error_code: "segredo_ausente",
        erro: "Webhook nao autenticado. Use a URL completa disponivel em Configuracoes > Portais (ela ja inclui o token).",
      })
    }

    const supabase = criarClienteAdmin()

    const { data: orgs } = await supabase
      .from("organizacoes")
      .select("id, webhook_secret")
      .eq("webhook_secret", segredo)
      .limit(1)

    const org = orgs?.[0]

    // A comparacao em tempo constante roda mesmo com a busca ja tendo filtrado
    // pelo segredo: mantem o custo uniforme e protege se a busca mudar.
    if (!org || !segredosConferem(segredo, org.webhook_secret ?? "")) {
      return responder(401, {
        error_code: "segredo_invalido",
        erro: "Token do webhook invalido.",
      })
    }

    const empresaId: string = org.id
    organizacaoId = empresaId

    // Detectar portal de origem (header ou body)
    const portalExplicito =
      request.headers.get("x-portal") ||
      (payloadObj.portal as string) ||
      undefined

    // Normalizar lead
    const leadNormalizado = normalizarLead(payloadObj, portalExplicito)
    portal = leadNormalizado.portal

    // Validar dados minimos
    if (!leadTemDadosMinimos(leadNormalizado)) {
      return responder(422, {
        error_code: "lead_sem_dados_minimos",
        erro: "Lead sem dados de contato (nome, email ou telefone)",
      })
    }

    // Salvar lead no banco (schema: supabase/migrations/006_leads_portais.sql)
    const { data: lead, error: erroLead } = await supabase
      .from("leads_portais")
      .insert({
        organizacao_id: empresaId,
        portal: leadNormalizado.portal,
        payload_original: payloadObj,
        nome: leadNormalizado.nome,
        email: leadNormalizado.email,
        telefone: leadNormalizado.telefone,
        mensagem: leadNormalizado.mensagem,
        imovel_codigo: leadNormalizado.imovel_codigo,
        status: "novo",
      })
      .select("id")
      .single()

    if (erroLead) {
      console.error("[Portais Webhook] Erro ao salvar lead", {
        organizacao_id: empresaId,
        portal: leadNormalizado.portal,
        mensagem: erroLead.message,
      })
      return responder(500, {
        error_code: "erro_salvar_lead",
        erro: "Erro ao salvar lead",
        detalhe: erroLead.message,
      })
    }

    // Disparar mensagem proativa via WhatsApp (assincrono, nao bloqueia a resposta)
    if (leadNormalizado.telefone) {
      after(async () => {
        try {
          const { enviarMensagemProativaPortal } = await import("@/lib/whatsapp/mensagem-proativa")
          await enviarMensagemProativaPortal({
            organizacaoId: empresaId,
            telefone: leadNormalizado.telefone!,
            nomeCliente: leadNormalizado.nome,
            imovelId: null,
            leadId: lead.id,
            portal: leadNormalizado.portal,
          })
        } catch (erro) {
          console.error("[Portais Webhook] Erro no envio proativo:", erro instanceof Error ? erro.message : erro)
        }
      })
    }

    return responder(201, {
      lead_id: lead.id,
      status: "processado",
    })
  } catch (erro) {
    console.error("[Portais Webhook] Erro geral", {
      organizacao_id: organizacaoId,
      portal,
      mensagem: erro instanceof Error ? erro.message : String(erro),
      stack: erro instanceof Error ? erro.stack : undefined,
    })
    return responder(500, {
      error_code: "erro_interno",
      erro: "Erro ao processar webhook",
      detalhe: erro instanceof Error ? erro.message : String(erro),
    })
  }
}
