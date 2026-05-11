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

    // Identificar organizacao pelo header ou campo no body
    const orgSlug =
      request.headers.get("x-org-slug") ||
      (payloadObj.org_slug as string) ||
      (payloadObj.organizacao_slug as string)

    const orgId =
      request.headers.get("x-org-id") ||
      (payloadObj.org_id as string) ||
      (payloadObj.organizacao_id as string) ||
      (payloadObj.empresa_id as string)

    if (!orgSlug && !orgId) {
      return responder(400, {
        error_code: "org_nao_identificada",
        erro: "Organizacao nao identificada. Envie x-org-slug no header ou org_slug no body.",
      })
    }

    const supabase = criarClienteAdmin()

    // Buscar empresa
    let empresaId: string

    if (orgId) {
      empresaId = orgId
    } else {
      const { data: org, error: erroOrg } = await supabase
        .from("organizacoes")
        .select("id")
        .eq("slug", orgSlug!)
        .single()

      if (erroOrg || !org) {
        return responder(404, {
          error_code: "org_nao_encontrada",
          erro: "Organizacao nao encontrada",
        })
      }
      empresaId = org.id
    }

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
