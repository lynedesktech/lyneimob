"use server"

import { criarClienteAdmin } from "@/lib/supabase/admin"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"
import { verificarPermissao } from "@/lib/permissoes"

/**
 * Devolve a URL completa do webhook de portais, já com o token da organização.
 *
 * O token identifica a imobiliária de destino na chamada do webhook, então ele
 * é uma credencial: não fica legível pela API do banco com o login do usuário
 * (migration 047) e só sai por aqui, para quem pode gerenciar integrações.
 */
export async function buscarUrlWebhookPortais(): Promise<{
  url?: string
  erro?: string
}> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) {
    return { erro: "Você precisa estar logado." }
  }

  const permissao = verificarPermissao(
    usuario.cargo,
    "gerenciar_integracoes",
    usuario.perfil_plataforma
  )
  if (permissao.erro) {
    return { erro: "Você não tem permissão para ver a URL do webhook." }
  }

  const supabase = criarClienteAdmin()

  const { data: org } = await supabase
    .from("organizacoes")
    .select("webhook_secret")
    .eq("id", usuario.organizacao_id)
    .single()

  if (!org?.webhook_secret) {
    return { erro: "Token do webhook ainda não foi gerado para esta organização." }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || ""
  return { url: `${base}/api/webhooks/portais?token=${org.webhook_secret}` }
}
