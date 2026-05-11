import { NextResponse } from "next/server"
import { removeContactBlock, setContactBlock } from "@/lib/whatsapp/ia-toggle"

// ============================================================
// LYNEDES-103 Sprint 2 — Desbloqueio/bloqueio manual da IA por contato
// POST com {chatId, orgId, action: "block"|"unblock"}
// Auth: x-internal-secret = SUPABASE_SERVICE_ROLE_KEY
// ============================================================

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret")
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const chatId = String(body?.chatId || "")
    const orgId = String(body?.orgId || "")
    const action = body?.action === "block" ? "block" : "unblock"

    if (!chatId || !orgId) {
      return NextResponse.json(
        { erro: "chatId e orgId obrigatorios" },
        { status: 400 }
      )
    }

    if (action === "block") {
      await setContactBlock(chatId, orgId)
      console.log(`[AI Block] Contato ${chatId} (org ${orgId}) BLOQUEADO`)
    } else {
      await removeContactBlock(chatId, orgId)
      console.log(`[AI Block] Contato ${chatId} (org ${orgId}) DESBLOQUEADO`)
    }

    return NextResponse.json({ status: "ok", chatId, orgId, action })
  } catch (erro) {
    console.error("[AI Block] Erro:", erro instanceof Error ? erro.message : erro)
    return NextResponse.json({ erro: "Payload invalido" }, { status: 400 })
  }
}
