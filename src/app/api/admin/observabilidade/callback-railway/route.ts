import { NextResponse } from "next/server"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { ehSuperAdmin, ehDesenvolvedor } from "@/lib/permissoes"
import { lerMetricasCallback } from "@/lib/observabilidade/callback-railway"

// ============================================================
// Endpoint admin — leitura das metricas do callback Railway
// (LYNEDES-151) — auth: super_admin ou desenvolvedor
// ============================================================

export async function GET() {
  const user = await obterUsuarioAutenticado()
  if (!user) {
    return NextResponse.json({ erro: "Nao autenticado" }, { status: 401 })
  }

  const usuario = await obterDadosUsuario(user.id)
  if (!usuario || (!ehSuperAdmin(usuario) && !ehDesenvolvedor(usuario))) {
    return NextResponse.json({ erro: "Sem permissao" }, { status: 403 })
  }

  const metricas = await lerMetricasCallback()
  return NextResponse.json(metricas)
}
