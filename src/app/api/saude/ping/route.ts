import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"

/**
 * Health check publico — sem autenticacao.
 *
 * Usado por monitores externos (BetterStack, UptimeRobot, StatusCake)
 * pra saber se a aplicacao esta no ar e consegue falar com o banco.
 *
 * NAO retorna nada sensivel: so status "ok" ou "erro" + o nome do
 * servico que falhou. Credenciais, contagens e metricas reais ficam
 * no endpoint auth-gated `/api/saude-integracoes`.
 *
 * Codigos HTTP:
 *   200 → tudo OK
 *   503 → algum servico basico indisponivel (banco)
 */
export async function GET() {
  const checks: Record<string, "ok" | "erro"> = {
    app: "ok",
  }

  // Check 1: Supabase responde com SELECT trivial
  try {
    const supabase = criarClienteAdmin()
    const { error } = await supabase
      .from("organizacoes")
      .select("id", { count: "exact", head: true })
      .limit(1)
    checks.banco = error ? "erro" : "ok"
  } catch {
    checks.banco = "erro"
  }

  const todoOk = Object.values(checks).every((v) => v === "ok")
  const body = {
    status: todoOk ? "ok" : "erro",
    timestamp: new Date().toISOString(),
    checks,
  }

  return NextResponse.json(body, {
    status: todoOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}
