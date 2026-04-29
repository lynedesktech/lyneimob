import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { criarClienteENegocioInicial } from "@/lib/whatsapp/conversa-utils"
import { validarAuthInterna } from "@/lib/auth-interna"

// ============================================================
// Endpoint interno — cria cliente + negócio para conversa nova
// Chamado pelo agente Python no Railway após criar conversa
// ============================================================

export async function POST(request: Request) {
  // LYNEDES-148: auth com secret dedicado (INTERNAL_API_SECRET)
  if (!validarAuthInterna(request)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  let corpo: {
    conversaId?: string
    organizacaoId?: string
    numeroCliente?: string
    nomeCliente?: string
  }

  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 })
  }

  const { conversaId, organizacaoId, numeroCliente, nomeCliente } = corpo

  if (!conversaId || !organizacaoId || !numeroCliente) {
    return NextResponse.json(
      { erro: "conversaId, organizacaoId e numeroCliente são obrigatórios" },
      { status: 400 }
    )
  }

  const supabase = criarClienteAdmin()

  // Verificar se a conversa já tem cliente/negócio vinculado
  const { data: conversa } = await supabase
    .from("conversas_whatsapp")
    .select("cliente_id, negocio_id")
    .eq("id", conversaId)
    .single()

  if (conversa?.cliente_id && conversa?.negocio_id) {
    return NextResponse.json({
      status: "ja_existe",
      cliente_id: conversa.cliente_id,
      negocio_id: conversa.negocio_id,
    })
  }

  // Buscar config do WhatsApp da organização
  const { data: config } = await supabase
    .from("config_whatsapp")
    .select("*")
    .eq("organizacao_id", organizacaoId)
    .eq("ativo", true)
    .single()

  if (!config) {
    return NextResponse.json(
      { erro: "Config WhatsApp não encontrada para esta organização" },
      { status: 404 }
    )
  }

  // Criar cliente + negócio
  const resultado = await criarClienteENegocioInicial(
    supabase,
    organizacaoId,
    numeroCliente,
    conversaId,
    config,
    { nomeCliente: nomeCliente || "Contato WhatsApp" }
  )

  if (!resultado) {
    return NextResponse.json(
      { erro: "Erro ao criar cliente/negócio" },
      { status: 500 }
    )
  }

  console.log(`[criar-cliente-negocio] Cliente ${resultado.clienteId} e negócio ${resultado.negocioId} criados para conversa ${conversaId}`)

  return NextResponse.json({
    status: "criado",
    cliente_id: resultado.clienteId,
    negocio_id: resultado.negocioId,
  })
}
