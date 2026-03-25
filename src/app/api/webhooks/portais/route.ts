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

    // Identificar empresa pelo header ou campo no body
    const orgSlug =
      request.headers.get("x-org-slug") ||
      (payload.org_slug as string) ||
      (payload.organizacao_slug as string)

    const orgId =
      request.headers.get("x-org-id") ||
      (payload.org_id as string) ||
      (payload.organizacao_id as string) ||
      (payload.empresa_id as string)

    // Identificar portal pelo token do webhook
    const tokenWebhook =
      request.headers.get("x-webhook-token") ||
      (payload.webhook_token as string)

    if (!orgSlug && !orgId && !tokenWebhook) {
      return NextResponse.json(
        { erro: "Organização não identificada. Envie x-org-slug no header ou org_slug no body." },
        { status: 400 }
      )
    }

    const supabase = criarClienteAdmin()

    // Buscar empresa e portal
    let empresaId: string
    let portalId: string | null = null

    if (tokenWebhook) {
      // Identificar via token do webhook — busca na tabela integracoes_portais
      const { data: integracao, error: erroIntegracao } = await supabase
        .from("integracoes_portais")
        .select("id, empresa_id, nome_portal")
        .eq("token_webhook", tokenWebhook)
        .eq("ativo", true)
        .single()

      if (erroIntegracao || !integracao) {
        return NextResponse.json(
          { erro: "Token de webhook inválido ou integração inativa" },
          { status: 404 }
        )
      }

      empresaId = integracao.empresa_id
      portalId = integracao.id
    } else if (orgId) {
      empresaId = orgId
    } else {
      const { data: org, error: erroOrg } = await supabase
        .from("empresas")
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

    // Detectar portal de origem (para normalização)
    const portalExplicito =
      request.headers.get("x-portal") ||
      (payload.portal as string) ||
      undefined

    // Se não temos portalId ainda, tentar encontrar pela nome_portal
    if (!portalId && portalExplicito) {
      const nomePortalMap: Record<string, string> = {
        zap: "ZAP Imóveis",
        zapimoveis: "ZAP Imóveis",
        olx: "OLX",
        vivareal: "VivaReal",
        imovelweb: "Imovelweb",
      }

      const nomeBusca = nomePortalMap[portalExplicito.toLowerCase()]
      if (nomeBusca) {
        const { data: integracao } = await supabase
          .from("integracoes_portais")
          .select("id")
          .eq("empresa_id", empresaId)
          .ilike("nome_portal", nomeBusca)
          .limit(1)
          .maybeSingle()

        if (integracao) {
          portalId = integracao.id
        }
      }
    }

    // Se ainda não temos portalId, buscar a primeira integração ativa da empresa
    if (!portalId) {
      const { data: integracao } = await supabase
        .from("integracoes_portais")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle()

      if (integracao) {
        portalId = integracao.id
      }
    }

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

    // Salvar lead no banco
    const dadosInsercao: Record<string, unknown> = {
      empresa_id: empresaId,
      nome: leadNormalizado.nome,
      email: leadNormalizado.email,
      telefone: leadNormalizado.telefone,
      mensagem: leadNormalizado.mensagem,
      imovel_referencia: leadNormalizado.imovel_codigo,
      dados_brutos: payload,
      convertido: false,
    }

    // Só adicionar portal_id se encontramos
    if (portalId) {
      dadosInsercao.portal_id = portalId
    }

    const { data: lead, error: erroLead } = await supabase
      .from("leads_portais")
      .insert(dadosInsercao)
      .select("id")
      .single()

    if (erroLead) {
      console.error("[Portais Webhook] Erro ao salvar lead:", erroLead.message)
      return NextResponse.json(
        { erro: "Erro ao salvar lead" },
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
    console.error("[Portais Webhook] Erro geral:", erro instanceof Error ? erro.message : erro)
    return NextResponse.json(
      { erro: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}
