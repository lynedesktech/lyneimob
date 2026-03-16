import { NextResponse } from "next/server"
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

    // Identificar organização pelo header ou campo no body
    const orgSlug =
      request.headers.get("x-org-slug") ||
      (payload.org_slug as string) ||
      (payload.organizacao_slug as string)

    const orgId =
      request.headers.get("x-org-id") ||
      (payload.org_id as string) ||
      (payload.organizacao_id as string)

    if (!orgSlug && !orgId) {
      return NextResponse.json(
        { erro: "Organização não identificada. Envie x-org-slug no header ou org_slug no body." },
        { status: 400 }
      )
    }

    const supabase = criarClienteAdmin()

    // Buscar organização
    let organizacaoId: string

    if (orgId) {
      organizacaoId = orgId
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
      organizacaoId = org.id
    }

    // Detectar portal de origem
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

    // Buscar imóvel pelo código (se informado) — fallback por UUID
    let imovelId: string | null = null
    if (leadNormalizado.imovel_codigo) {
      const { data: imovel } = await supabase
        .from("imoveis")
        .select("id")
        .eq("organizacao_id", organizacaoId)
        .eq("codigo", leadNormalizado.imovel_codigo)
        .single()

      if (imovel) {
        imovelId = imovel.id
      } else {
        // Fallback: tentar como UUID (portal pode enviar o ID interno)
        const { data: imovelPorId } = await supabase
          .from("imoveis")
          .select("id")
          .eq("organizacao_id", organizacaoId)
          .eq("id", leadNormalizado.imovel_codigo)
          .single()

        if (imovelPorId) {
          imovelId = imovelPorId.id
        }
      }
    }

    // Salvar lead no banco
    const { data: lead, error: erroLead } = await supabase
      .from("leads_portais")
      .insert({
        organizacao_id: organizacaoId,
        portal: leadNormalizado.portal,
        payload_original: payload,
        nome: leadNormalizado.nome,
        email: leadNormalizado.email,
        telefone: leadNormalizado.telefone,
        mensagem: leadNormalizado.mensagem,
        imovel_codigo: leadNormalizado.imovel_codigo,
        imovel_id: imovelId,
        status: "novo",
      })
      .select("id")
      .single()

    if (erroLead) {
      console.error("[Portais Webhook] Erro ao salvar lead:", erroLead.message)
      return NextResponse.json(
        { erro: "Erro ao salvar lead" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { lead_id: lead.id, status: "processado" },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { erro: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}
