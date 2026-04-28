import { after, NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { normalizarLead, leadTemDadosMinimos } from "@/lib/leads/normalizador"

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { erro: "Payload inválido" },
        { status: 400 }
      )
    }

    // Identificar organizacao pelo header ou campo no body
    const orgSlug =
      request.headers.get("x-org-slug") ||
      (payload.org_slug as string) ||
      (payload.organizacao_slug as string)

    const orgId =
      request.headers.get("x-org-id") ||
      (payload.org_id as string) ||
      (payload.organizacao_id as string) ||
      (payload.empresa_id as string)

    if (!orgSlug && !orgId) {
      return NextResponse.json(
        { erro: "Organização não identificada. Envie x-org-slug no header ou org_slug no body." },
        { status: 400 }
      )
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
        return NextResponse.json(
          { erro: "Organização não encontrada" },
          { status: 404 }
        )
      }
      empresaId = org.id
    }

    // Detectar portal de origem (header ou body)
    const portalExplicito =
      request.headers.get("x-portal") ||
      (payload.portal as string) ||
      undefined

    // Normalizar lead
    const leadNormalizado = normalizarLead(
      payload as Record<string, unknown>,
      portalExplicito
    )

    // Validar dados mínimos
    if (!leadTemDadosMinimos(leadNormalizado)) {
      return NextResponse.json(
        { erro: "Lead sem dados de contato (nome, email ou telefone)" },
        { status: 422 }
      )
    }

    // Salvar lead no banco (schema: supabase/migrations/006_leads_portais.sql)
    const { data: lead, error: erroLead } = await supabase
      .from("leads_portais")
      .insert({
        organizacao_id: empresaId,
        portal: leadNormalizado.portal,
        payload_original: payload,
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
      console.error("[Portais Webhook] Erro ao salvar lead:", erroLead.message, {
        organizacao_id: empresaId,
        portal: leadNormalizado.portal,
      })
      return NextResponse.json(
        { erro: "Erro ao salvar lead", detalhe: erroLead.message },
        { status: 500 }
      )
    }

    // Disparar mensagem proativa via WhatsApp (assíncrono, não bloqueia a resposta)
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

    return NextResponse.json(
      { lead_id: lead.id, status: "processado" },
      { status: 201 }
    )
  } catch (erro) {
    console.error("[Portais Webhook] Erro geral:", erro instanceof Error ? erro.message : erro, {
      stack: erro instanceof Error ? erro.stack : undefined,
    })
    return NextResponse.json(
      {
        erro: "Erro ao processar webhook",
        detalhe: erro instanceof Error ? erro.message : String(erro),
      },
      { status: 500 }
    )
  }
}
