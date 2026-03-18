"use server"

import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { ehSuperAdmin } from "@/lib/permissoes"
import {
  criarInstanciaUazapi,
  conectarInstanciaUazapi,
  verificarStatusUazapi,
  desconectarInstanciaUazapi,
  excluirInstanciaUazapi,
  configurarWebhookUazapi,
  extrairNumero,
  testarConexaoUazapi,
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

/** Busca URL e admintoken da Uazapi nas configurações de integrações.
 *  As credenciais são da plataforma inteira — ficam na org do super_admin.
 *  Usamos o cliente admin para bypasaar o RLS e ler entre organizações. */
async function buscarCredenciaisAdmin(_organizacaoId: string) {
  const supabaseAdmin = criarClienteAdmin()

  // Localizar a organização do super_admin (onde as credenciais são gravadas)
  const { data: superAdmin } = await supabaseAdmin
    .from("usuarios")
    .select("organizacao_id")
    .eq("super_admin", true)
    .limit(1)
    .single()

  if (!superAdmin) return null

  const { data: org } = await supabaseAdmin
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", superAdmin.organizacao_id)
    .single()

  const config = (org?.configuracoes_integracoes ?? {}) as Record<string, string>
  const url = config.uazapi_url
  const adminToken = config.uazapi_token

  if (!url || !adminToken) return null
  return { url, adminToken }
}

// ============================================================
// Configurar credenciais admin da Uazapi
// ============================================================

export async function configurarCredenciaisUazapi(
  url: string,
  token: string
): Promise<EstadoFormulario> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  if (!ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador da plataforma pode configurar integrações." }
  }

  const urlLimpa = url.trim()
  const tokenLimpo = token.trim()

  if (!urlLimpa || !tokenLimpo) {
    return { erro: "Preencha a URL e o token da Uazapi." }
  }

  // Validar credenciais antes de salvar
  const valido = await testarConexaoUazapi(urlLimpa, tokenLimpo)
  if (!valido) {
    return { erro: "Não foi possível conectar à Uazapi. Verifique a URL e o token e tente novamente." }
  }

  const supabase = await criarClienteServer()

  const { data: org } = await supabase
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  const configAtual = (org?.configuracoes_integracoes ?? {}) as Record<string, string>

  const { error } = await supabase
    .from("organizacoes")
    .update({
      configuracoes_integracoes: { ...configAtual, uazapi_url: urlLimpa, uazapi_token: tokenLimpo },
    })
    .eq("id", usuario.organizacao_id)

  if (error) return { erro: "Erro ao salvar credenciais. Tente novamente." }

  return { sucesso: "Credenciais configuradas com sucesso!" }
}

// ============================================================
// Criar instância + conectar (gerar QR code)
// ============================================================

export async function criarEConectarInstancia(): Promise<
  EstadoFormulario & { qrCode?: string; status?: StatusInstancia }
> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  if (usuario.cargo !== "admin" && !ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador pode gerenciar instâncias WhatsApp." }
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
    // Já tem instância criada — validar se o token ainda funciona
    try {
      await verificarStatusUazapi(credenciais.url, configExistente.uazapi_token)
      instanceToken = configExistente.uazapi_token
      instanceId = configExistente.instance_id
    } catch {
      // Token inválido — excluir instância antiga e criar nova
      console.log("[Instância WhatsApp] Token antigo inválido, recriando instância...")
      try {
        await excluirInstanciaUazapi(credenciais.url, credenciais.adminToken, configExistente.instance_id)
      } catch { /* instância pode já não existir */ }

      const nomeInstancia = `lyneimob-${usuario.organizacao_id.slice(0, 8)}`
      const instancia = await criarInstanciaUazapi(credenciais.url, credenciais.adminToken, nomeInstancia)
      instanceToken = instancia.token
      instanceId = instancia.id

      // Salvar novo token no banco
      await supabase
        .from("config_whatsapp")
        .update({ uazapi_url: credenciais.url, uazapi_token: instanceToken, instance_id: instanceId })
        .eq("id", configExistente.id)
    }
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

  }

  // Configurar webhook — sempre, seja instância nova ou reutilizada
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const webhookUrl = `${appUrl}/api/webhooks/whatsapp`

  try {
    await configurarWebhookUazapi(credenciais.url, instanceToken, webhookUrl)
  } catch (err) {
    console.error("[Instância WhatsApp] Erro ao configurar webhook:", err instanceof Error ? err.message : err)
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

    // Sincronizar token — se a Uazapi retornou um token diferente, atualizar no banco
    const tokenRetornado = resposta.instance?.token
    if (tokenRetornado && tokenRetornado !== config.uazapi_token) {
      await supabase
        .from("config_whatsapp")
        .update({ uazapi_token: tokenRetornado })
        .eq("id", config.id)
      console.log(`[Instância WhatsApp] Token atualizado no banco para config ${config.id}`)
    }

    // Se acabou de conectar, ativar instância e salvar número quando disponível
    if (conectado && !config.ativo) {
      const updates: Record<string, unknown> = { ativo: true }
      if (resposta.status?.jid) {
        updates.numero_whatsapp = extrairNumero(resposta.status.jid)
      }
      await supabase
        .from("config_whatsapp")
        .update(updates)
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

  if (usuario.cargo !== "admin" && !ehSuperAdmin(usuario)) {
    return { erro: "Apenas o administrador pode gerenciar instâncias WhatsApp." }
  }

  const credenciais = await buscarCredenciaisAdmin(usuario.organizacao_id)
  if (!credenciais) return { erro: "Credenciais Uazapi não configuradas" }

  const supabase = await criarClienteServer()

  const { data: config } = await supabase
    .from("config_whatsapp")
    .select("id, uazapi_token, instance_id")
    .eq("organizacao_id", usuario.organizacao_id)
    .single()

  if (!config?.uazapi_token) return { erro: "Nenhuma instância encontrada" }

  // Desconectar sessão WhatsApp
  try {
    await desconectarInstanciaUazapi(credenciais.url, config.uazapi_token)
  } catch (err) {
    console.error("[Instância WhatsApp] Erro ao desconectar:", err instanceof Error ? err.message : err)
    // Segue para excluir mesmo se desconexão falhar
  }

  // Excluir instância na Uazapi para não gerar órfã
  if (config.instance_id) {
    try {
      await excluirInstanciaUazapi(credenciais.url, credenciais.adminToken, config.instance_id)
    } catch (err) {
      console.error("[Instância WhatsApp] Erro ao excluir instância na Uazapi (prosseguindo com limpeza do banco):", err instanceof Error ? err.message : err)
      // Não retorna — segue para limpar o banco de qualquer forma
    }
  }

  // Limpar config: desativar, remover número e dados da instância
  await supabase
    .from("config_whatsapp")
    .update({ ativo: false, numero_whatsapp: null, instance_id: null, uazapi_token: null })
    .eq("id", config.id)

  return { sucesso: "WhatsApp desconectado e instância excluída com sucesso" }
}
