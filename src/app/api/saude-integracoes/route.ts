import { NextResponse } from "next/server"
import { criarClienteServer } from "@/lib/supabase/server"
import { verificarSaudeIntegracoes } from "@/lib/saude-integracoes"
import { descriptografarCredenciais } from "@/lib/criptografia"

export async function GET() {
  // Autenticar usuário
  const supabase = await criarClienteServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { erro: "Não autenticado." },
      { status: 401 }
    )
  }

  // Verificar se é super_admin
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("organizacao_id, super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (!usuario || (!["super_admin", "desenvolvedor"].includes(usuario.perfil_plataforma ?? "") && !usuario.super_admin)) {
    return NextResponse.json(
      { erro: "Sem permissão para verificar saúde das integrações." },
      { status: 403 }
    )
  }

  // Buscar credenciais do banco
  const { data: org } = await supabase
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  const configBancoCriptografado = (org?.configuracoes_integracoes ?? {}) as Record<string, string>
  const configBanco = descriptografarCredenciais(configBancoCriptografado)

  // Usar APENAS credenciais do banco — sem fallback para env vars
  // Se não está cadastrado no banco, deve aparecer como "Não configurado"
  const credenciais = {
    stripe_secret_key: configBanco.stripe_secret_key || undefined,
    openai_api_key: configBanco.openai_api_key || undefined,
    uazapi_url: configBanco.uazapi_url || undefined,
    uazapi_token: configBanco.uazapi_token || undefined,
    upstash_redis_url: configBanco.upstash_redis_url || undefined,
    upstash_redis_token: configBanco.upstash_redis_token || undefined,
  }

  const saude = await verificarSaudeIntegracoes(credenciais)

  return NextResponse.json(saude)
}
