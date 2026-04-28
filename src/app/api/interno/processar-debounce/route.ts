import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { validarAuthInterna } from "@/lib/auth-interna"

// ============================================================
// Endpoint interno de debounce — processa mensagens agrupadas
// Chamado pelo webhook via fetch, roda em invocação separada
// ============================================================

export const maxDuration = 60

const DEBOUNCE_MS = 20_000 // 20 segundos
const MAX_CICLOS = 2 // Máximo 2 ciclos de espera (40s total)

export async function POST(request: Request) {
  // LYNEDES-148: auth com secret dedicado (INTERNAL_API_SECRET)
  if (!validarAuthInterna(request)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  let corpo: { conversaId?: string; organizacaoId?: string; numeroCliente?: string }
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 })
  }

  const { conversaId, organizacaoId, numeroCliente } = corpo

  if (!conversaId || !organizacaoId) {
    return NextResponse.json({ erro: "Dados incompletos" }, { status: 400 })
  }

  // Lock Redis: só uma invocação processa por número de cliente
  // Usa organizacaoId + numeroCliente (não conversaId) para evitar race condition
  // onde múltiplas conversas são criadas para o mesmo número
  const { redis } = await import("@/lib/redis")
  const chaveCliente = numeroCliente || conversaId // fallback pro conversaId se não tiver numero
  const chaveLock = `lock:debounce:${organizacaoId}:${chaveCliente}`

  if (redis) {
    const adquiriu = await redis.set(chaveLock, "1", { nx: true, ex: 90 })
    if (!adquiriu) {
      console.log(`[Debounce] Lock não adquirido para ${chaveCliente} — outra invocação cuida`)
      return NextResponse.json({ status: "ignorado" })
    }
  } else {
    console.warn("[Debounce] Redis não configurado — lock desativado")
  }

  try {
    const supabase = criarClienteAdmin()

    // Loop de polling: espera 20s, checa se novas mensagens chegaram
    // Replica o padrão do N8N (delay → verificar → delay de novo se necessário)
    for (let ciclo = 0; ciclo < MAX_CICLOS; ciclo++) {
      await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS))

      // Checar última mensagem recebida no banco
      const { data: conversa } = await supabase
        .from("conversas_whatsapp")
        .select("ultima_mensagem_em")
        .eq("id", conversaId)
        .single()

      if (!conversa) break

      const diffMs = Date.now() - new Date(conversa.ultima_mensagem_em).getTime()

      if (diffMs >= DEBOUNCE_MS) {
        // Nenhuma mensagem nova nos últimos 20s — hora de processar
        break
      }

      // Mensagem recente chegou — esperar mais um ciclo
      console.log(
        `[Debounce] Conversa ${conversaId} — mensagem recente (${Math.round(diffMs / 1000)}s atrás), esperando mais`
      )
    }

    // Processar lote (mídia + agente IA)
    console.log(`[Debounce] Processando lote da conversa ${conversaId}`)
    const { processarLote } = await import("@/lib/whatsapp/debounce")
    await processarLote(conversaId, organizacaoId)

    return NextResponse.json({ status: "processado" })
  } catch (erro) {
    console.error(
      `[Debounce] Erro ao processar conversa ${conversaId}:`,
      erro instanceof Error ? erro.message : erro
    )
    return NextResponse.json({ erro: "Erro no processamento" }, { status: 500 })
  } finally {
    // Sempre liberar lock ao finalizar
    if (redis) {
      await redis.del(chaveLock).catch(() => {})
    }
  }
}
