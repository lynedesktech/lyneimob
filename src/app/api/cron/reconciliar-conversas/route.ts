import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { criarClienteENegocioInicial } from "@/lib/whatsapp/conversa-utils"

// ============================================================
// LYNEDES-150 — Cron de reconciliacao callback Railway
// Cron diario (Vercel) — varre conversas orfas (cliente_id NULL E
// negocio_id NULL) criadas nos ultimos 7 dias e dispara o callback
// criarClienteENegocioInicial pra preencher os registros faltantes.
//
// Cobre o cenario raro em que ambos os retries do callback Railway
// falham — sem essa rede de seguranca, a conversa fica orfa pra
// sempre porque o webhook detecta isNova=false na proxima mensagem.
// ============================================================

export const maxDuration = 60

const DIAS_LOOKBACK = 7

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 })
  }

  const supabase = criarClienteAdmin()
  const desde = new Date(Date.now() - DIAS_LOOKBACK * 24 * 60 * 60 * 1000).toISOString()

  const { data: orfas, error: erroBusca } = await supabase
    .from("conversas_whatsapp")
    .select("id, organizacao_id, numero_cliente, nome_cliente")
    .is("cliente_id", null)
    .is("negocio_id", null)
    .gte("criado_em", desde)

  if (erroBusca) {
    console.error("[CRON-RECONCILIACAO] Erro ao buscar orfas:", erroBusca.message)
    return NextResponse.json({ erro: "Erro ao buscar conversas" }, { status: 500 })
  }

  if (!orfas || orfas.length === 0) {
    console.log("[CRON-RECONCILIACAO] Nenhuma conversa orfa encontrada.")
    return NextResponse.json({ status: "ok", reconciliadas: 0, falhas: 0 })
  }

  console.log(`[CRON-RECONCILIACAO] Encontradas ${orfas.length} conversa(s) orfa(s) nos ultimos ${DIAS_LOOKBACK} dias.`)

  let reconciliadas = 0
  let falhas = 0
  const detalhes: { id: string; status: "ok" | "fail"; motivo?: string }[] = []

  for (const conversa of orfas) {
    try {
      // Buscar config da org pra usar no callback
      const { data: config } = await supabase
        .from("config_whatsapp")
        .select("*")
        .eq("organizacao_id", conversa.organizacao_id)
        .eq("ativo", true)
        .single()

      if (!config) {
        falhas++
        detalhes.push({ id: conversa.id, status: "fail", motivo: "config_whatsapp_inativa" })
        console.warn(`[CRON-RECONCILIACAO] Conversa ${conversa.id} pulada — config WhatsApp inativa pra org ${conversa.organizacao_id}`)
        continue
      }

      const resultado = await criarClienteENegocioInicial(
        supabase,
        conversa.organizacao_id,
        conversa.numero_cliente,
        conversa.id,
        config,
        { nomeCliente: conversa.nome_cliente || "Contato WhatsApp" }
      )

      if (!resultado) {
        falhas++
        detalhes.push({ id: conversa.id, status: "fail", motivo: "criarClienteENegocioInicial_retornou_null" })
        console.error(`[CRON-RECONCILIACAO] Falha ao reconciliar conversa ${conversa.id} (org ${conversa.organizacao_id})`)
        continue
      }

      reconciliadas++
      detalhes.push({ id: conversa.id, status: "ok" })
      console.log(
        `[CRON-RECONCILIACAO] Conversa ${conversa.id} reconciliada — cliente=${resultado.clienteId} negocio=${resultado.negocioId} (org ${conversa.organizacao_id})`
      )
    } catch (erro) {
      falhas++
      const motivo = erro instanceof Error ? erro.message : String(erro)
      detalhes.push({ id: conversa.id, status: "fail", motivo })
      console.error(`[CRON-RECONCILIACAO] Excecao ao reconciliar conversa ${conversa.id}: ${motivo}`)
    }
  }

  console.log(`[CRON-RECONCILIACAO] Resumo: ${reconciliadas} reconciliadas, ${falhas} falhas, ${orfas.length} avaliadas.`)

  return NextResponse.json({
    status: "ok",
    reconciliadas,
    falhas,
    total_avaliadas: orfas.length,
    lookback_dias: DIAS_LOOKBACK,
    detalhes,
  })
}
