import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"

// ============================================================
// LYNEDES-103 Sprint 2 — Auto-close de conversas paradas
// Cron a cada 6h (Vercel)
// Fecha conversas em em_andamento/qualificado sem atividade ha 24h+
// NAO fecha conversas com status "encaminhado" (corretor pode estar tratando)
// ============================================================

export const maxDuration = 60

const HORAS_INATIVIDADE = 24
const STATUS_FECHAVEIS = ["em_andamento", "qualificado"]

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 })
  }

  const supabase = criarClienteAdmin()
  const limiteIso = new Date(Date.now() - HORAS_INATIVIDADE * 60 * 60 * 1000).toISOString()

  // Buscar conversas paradas (sem mensagem ha mais de 24h)
  const { data: paradas, error: erroBusca } = await supabase
    .from("conversas_whatsapp")
    .select("id, organizacao_id, numero_cliente, status, ultima_mensagem_em")
    .in("status", STATUS_FECHAVEIS)
    .lt("ultima_mensagem_em", limiteIso)

  if (erroBusca) {
    console.error("[cron/auto-close] Erro ao buscar conversas:", erroBusca.message)
    return NextResponse.json({ erro: "Erro ao buscar conversas" }, { status: 500 })
  }

  if (!paradas || paradas.length === 0) {
    console.log("[cron/auto-close] Nenhuma conversa parada encontrada.")
    return NextResponse.json({ status: "ok", fechadas: 0 })
  }

  // Atualizar todas em batch para "arquivado"
  const ids = paradas.map((c) => c.id)
  const { error: erroUpdate } = await supabase
    .from("conversas_whatsapp")
    .update({ status: "arquivado" })
    .in("id", ids)

  if (erroUpdate) {
    console.error("[cron/auto-close] Erro ao arquivar conversas:", erroUpdate.message)
    return NextResponse.json({ erro: "Erro ao arquivar conversas" }, { status: 500 })
  }

  for (const c of paradas) {
    console.log(
      `[Auto-close] Conversa ${c.id} arquivada — ${HORAS_INATIVIDADE}h+ sem atividade ` +
      `(numero: ${c.numero_cliente}, org: ${c.organizacao_id})`
    )
  }

  return NextResponse.json({
    status: "ok",
    fechadas: paradas.length,
    limiteHoras: HORAS_INATIVIDADE,
  })
}
