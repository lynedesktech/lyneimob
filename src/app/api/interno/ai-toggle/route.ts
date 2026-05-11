import { NextResponse } from "next/server"
import { isIAGlobalEnabled, setIAGlobal } from "@/lib/whatsapp/ia-toggle"

// ============================================================
// LYNEDES-103 Sprint 2 — Toggle global da IA
// POST: liga/desliga IA globalmente
// GET: retorna estado atual
// Auth: x-internal-secret = SUPABASE_SERVICE_ROLE_KEY
// ============================================================

export async function GET(request: Request) {
  const secret = request.headers.get("x-internal-secret")
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 })
  }

  const enabled = await isIAGlobalEnabled()
  return NextResponse.json({ ai_enabled: enabled })
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret")
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const enabled = Boolean(body?.enabled)

    await setIAGlobal(enabled)
    console.log(`[AI Toggle] IA global ${enabled ? "ATIVADA" : "DESATIVADA"}`)

    return NextResponse.json({ status: "ok", ai_enabled: enabled })
  } catch (erro) {
    console.error("[AI Toggle] Erro:", erro instanceof Error ? erro.message : erro)
    return NextResponse.json({ erro: "Payload invalido" }, { status: 400 })
  }
}
