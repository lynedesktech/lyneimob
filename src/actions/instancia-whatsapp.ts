"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import { ehSuperAdmin } from "@/lib/permissoes"
import {
  criarInstanciaUazapi,
  conectarInstanciaUazapi,
  verificarStatusUazapi,
  desconectarInstanciaUazapi,
  configurarWebhookUazapi,
  extrairNumero,
} from "@/lib/whatsapp/uazapi"
import type { StatusInstancia } from "@/types/whatsapp"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Helpers
// ============================================================

async function buscarUsuarioLogado() {
  const supabase = await criarClienteServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo, super_admin")
    .eq("id", user.id)
    .single()

  return usuario
}

/** Busca URL e admintoken da Uazapi nas configurações de integrações */
async function buscarCredenciaisAdmin(organizacaoId: string) {
  const supabase = await criarClienteServer()

  const { data: org } = await supabase
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", organizacaoId)
    .single()

  const config = (org?.configuracoes_integracoes ?? {}) as Record<string, string>
  const url = config.uazapi_url
  const adminToken = config.uazapi_token

  if (!url || !adminToken) return null
  return { url, adminToken }
}

// ============================================================
// Criar instância + conectar (gerar QR code)
// ============================================================

export async function criarEConectarInstancia(): Promise<
  EstadoFormulario & { qrCode?: string; status?: StatusInstancia }
> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  if (!ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador da plataforma pode gerenciar instâncias WhatsApp." }
  }

  const credenciais = await buscarCredenciaisAdmin(usuario.organizacao_id)
  if (!credenciais) {
    return { erro: "Configure a URL e o token da Uazapi em Configurações antes de conectar." }
  }

  const supabase = await criarClienteServer()

  // Verificar se já existe config para a org
  const { data: configExistente } = await supabase
    .from("config_whatsapp")
    .select("id, uazapi_token, instance_id")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  let instanceToken: string
  let instanceId: string

  if (configExistente?.uazapi_token && configExistente?.instance_id) {
    // Já tem instância criada — reusar
    instanceToken = configExistente.uazapi_token
    instanceId = configExistente.instance_id
  } else {
    // Criar nova instância
    try {
      const nomeInstancia = `lyneimob-${usuario.organizacao_id.slice(0, 8)}`
      const instancia = await criarInstanciaUazapi(
        credenciais.url,
        credenciais.adminToken,
        nomeInstancia
      )
      instanceToken = instancia.token
      instanceId = instancia.id
    } catch (err) {
      console.error("[Instância WhatsApp] Erro ao criar:", err instanceof Error ? err.message : err)
      return { erro: "Erro ao criar instância na Uazapi. Verifique suas credenciais." }
    }

    // Salvar/atualizar config_whatsapp com o token da instância
    if (configExistente) {
      await supabase
        .from("config_whatsapp")
        .update({
          uazapi_url: credenciais.url,
          uazapi_token: instanceToken,
          instance_id: instanceId,
        })
        .eq("id", configExistente.id)
    } else {
      await supabase.from("config_whatsapp").insert({
        organizacao_id: usuario.organizacao_id,
        uazapi_url: credenciais.url,
        uazapi_token: instanceToken,
        instance_id: instanceId,
        ativo: false,
      })
    }

    // Configurar webhook automaticamente
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${appUrl}/api/webhooks/whatsapp`

    try {
      await configurarWebhookUazapi(credenciais.url, instanceToken, webhookUrl)
    } catch (err) {
      console.error("[Instância WhatsApp] Erro ao configurar webhook:", err instanceof Error ? err.message : err)
    }
  }

  // Conectar (gerar QR code)
  try {
    const resposta = await conectarInstanciaUazapi(credenciais.url, instanceToken)
    return {
      sucesso: "QR code gerado",
      qrCode: resposta.instance?.qrcode || undefined,
      status: resposta.instance?.status || "connecting",
    }
  } catch (err) {
    console.error("[Instância WhatsApp] Erro ao conectar:", err instanceof Error ? err.message : err)
    return { erro: "Erro ao gerar QR code. Tente novamente." }
  }
}

// ============================================================
// Verificar status (polling)
// ============================================================

export async function verificarStatusInstancia(): Promise<
  EstadoFormulario & {
    status?: StatusInstancia
    qrCode?: string
    numero?: string
    perfilNome?: string
    perfilFoto?: string
    configurado?: boolean
  }
> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  // Verificar se tem credenciais admin configuradas
  const credenciais = await buscarCredenciaisAdmin(usuario.organizacao_id)
  if (!credenciais) {
    return { sucesso: "Sem credenciais", configurado: false, status: "disconnected" }
  }

  const supabase = await criarClienteServer()

  // Buscar config da instância
  const { data: config } = await supabase
    .from("config_whatsapp")
    .select("*")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (!config?.uazapi_token || !config?.instance_id) {
    return { sucesso: "Sem instância", configurado: true, status: "disconnected" }
  }

  try {
    const resposta = await verificarStatusUazapi(credenciais.url, config.uazapi_token)
    const statusConexao = resposta.instance?.status || "disconnected"
    const conectado = resposta.status?.connected || statusConexao === "connected"

    // Se acabou de conectar, salvar número e ativar
    if (conectado && resposta.status?.jid && !config.numero_whatsapp) {
      const numero = extrairNumero(resposta.status.jid)
      await supabase
        .from("config_whatsapp")
        .update({ numero_whatsapp: numero, ativo: true })
        .eq("id", config.id)
    }

    return {
      sucesso: "Status verificado",
      configurado: true,
      status: conectado ? "connected" : statusConexao,
      qrCode: resposta.instance?.qrcode || undefined,
      numero: config.numero_whatsapp || (conectado && resposta.status?.jid ? extrairNumero(resposta.status.jid) : undefined),
      perfilNome: resposta.instance?.profileName || undefined,
      perfilFoto: resposta.instance?.profilePicUrl || undefined,
    }
  } catch (err) {
    console.error("[Instância WhatsApp] Erro ao verificar status:", err instanceof Error ? err.message : err)
    return { sucesso: "Erro ao verificar", configurado: true, status: "disconnected" }
  }
}

// ============================================================
// Desconectar instância
// ============================================================

export async function desconectarInstancia(): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  if (!ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador da plataforma pode gerenciar instâncias WhatsApp." }
  }

  const credenciais = await buscarCredenciaisAdmin(usuario.organizacao_id)
  if (!credenciais) return { erro: "Credenciais Uazapi não configuradas" }

  const supabase = await criarClienteServer()

  const { data: config } = await supabase
    .from("config_whatsapp")
    .select("id, uazapi_token")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (!config?.uazapi_token) return { erro: "Nenhuma instância encontrada" }

  try {
    await desconectarInstanciaUazapi(credenciais.url, config.uazapi_token)
  } catch (err) {
    console.error("[Instância WhatsApp] Erro ao desconectar:", err instanceof Error ? err.message : err)
    return { erro: "Erro ao desconectar. Tente novamente." }
  }

  // Atualizar config: desativar e limpar número
  await supabase
    .from("config_whatsapp")
    .update({ ativo: false, numero_whatsapp: null })
    .eq("id", config.id)

  return { sucesso: "WhatsApp desconectado com sucesso" }
}
