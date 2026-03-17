import type { ConfigWhatsapp, RespostaInstanciaUazapi } from "@/types/whatsapp"

// ============================================================
// Wrapper da API Uazapi
// Funções para comunicação com o WhatsApp via Uazapi
// ============================================================

function montarUrl(config: ConfigWhatsapp, caminho: string): string {
  const base = config.uazapi_url.replace(/\/$/, "")
  return `${base}${caminho}`
}

function montarUrlBase(url: string, caminho: string): string {
  return `${url.replace(/\/$/, "")}${caminho}`
}

function montarHeaders(config: ConfigWhatsapp): HeadersInit {
  return {
    "Content-Type": "application/json",
    token: config.uazapi_token,
  }
}

async function requisicaoUazapi(
  config: ConfigWhatsapp,
  caminho: string,
  body: Record<string, unknown>
): Promise<Response> {
  const resposta = await fetch(montarUrl(config, caminho), {
    method: "POST",
    headers: montarHeaders(config),
    body: JSON.stringify(body),
  })

  if (!resposta.ok) {
    const erro = await resposta.text().catch(() => "Erro desconhecido")
    throw new Error(`Uazapi erro (${resposta.status}): ${erro}`)
  }

  return resposta
}

// ============================================================
// Gestão de instância
// ============================================================

/** Cria uma nova instância na Uazapi (usa admintoken) */
export async function criarInstanciaUazapi(
  url: string,
  adminToken: string,
  nome: string
): Promise<{ id: string; token: string }> {
  const resposta = await fetch(montarUrlBase(url, "/instance/init"), {
    method: "POST",
    headers: { "Content-Type": "application/json", admintoken: adminToken },
    body: JSON.stringify({ name: nome }),
  })

  if (!resposta.ok) {
    const erro = await resposta.text().catch(() => "Erro desconhecido")
    throw new Error(`Erro ao criar instância: ${erro}`)
  }

  const dados = await resposta.json()
  return { id: dados.instance.id, token: dados.instance.token }
}

/** Solicita conexão via QR code (usa token da instância) */
export async function conectarInstanciaUazapi(
  url: string,
  token: string
): Promise<RespostaInstanciaUazapi> {
  const resposta = await fetch(montarUrlBase(url, "/instance/connect"), {
    method: "POST",
    headers: { "Content-Type": "application/json", token },
    body: JSON.stringify({}),
  })

  if (!resposta.ok) {
    const erro = await resposta.text().catch(() => "Erro desconhecido")
    throw new Error(`Erro ao conectar instância: ${erro}`)
  }

  return resposta.json()
}

/** Verifica status da instância (retorna QR atualizado se connecting) */
export async function verificarStatusUazapi(
  url: string,
  token: string
): Promise<RespostaInstanciaUazapi> {
  const resposta = await fetch(montarUrlBase(url, "/instance/status"), {
    method: "GET",
    headers: { "Content-Type": "application/json", token },
  })

  if (!resposta.ok) {
    const erro = await resposta.text().catch(() => "Erro desconhecido")
    throw new Error(`Erro ao verificar status: ${erro}`)
  }

  return resposta.json()
}

/** Desconecta a instância (requer novo QR para reconectar) */
export async function desconectarInstanciaUazapi(
  url: string,
  token: string
): Promise<void> {
  const resposta = await fetch(montarUrlBase(url, "/instance/disconnect"), {
    method: "POST",
    headers: { "Content-Type": "application/json", token },
  })

  if (!resposta.ok) {
    const erro = await resposta.text().catch(() => "Erro desconhecido")
    throw new Error(`Erro ao desconectar: ${erro}`)
  }
}

/** Exclui permanentemente uma instância na Uazapi (usa admintoken) */
export async function excluirInstanciaUazapi(
  url: string,
  adminToken: string,
  instanceId: string
): Promise<void> {
  const resposta = await fetch(montarUrlBase(url, `/instance/${instanceId}`), {
    method: "DELETE",
    headers: { "Content-Type": "application/json", token: adminToken },
  })

  if (!resposta.ok) {
    // 404 = instância já não existe na Uazapi — objetivo atingido, não é erro
    if (resposta.status === 404) return
    const erro = await resposta.text().catch(() => "Erro desconhecido")
    throw new Error(`Erro ao excluir instância: ${erro}`)
  }
}

/** Configura o webhook da instância para receber mensagens */
export async function configurarWebhookUazapi(
  url: string,
  token: string,
  webhookUrl: string
): Promise<void> {
  const resposta = await fetch(montarUrlBase(url, "/webhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json", token },
    body: JSON.stringify({
      url: webhookUrl,
      enabled: true,
      events: ["messages", "connection"],
      excludeMessages: ["wasSentByApi", "isGroupYes"],
    }),
  })

  if (!resposta.ok) {
    const erro = await resposta.text().catch(() => "Erro desconhecido")
    throw new Error(`Erro ao configurar webhook: ${erro}`)
  }
}

// ============================================================
// Funções públicas
// ============================================================

export async function enviarTexto(
  config: ConfigWhatsapp,
  numero: string,
  texto: string,
  opcoes?: { delay?: number; readmessages?: boolean }
): Promise<void> {
  await requisicaoUazapi(config, "/send/text", {
    number: numero,
    text: texto,
    ...(opcoes?.delay !== undefined ? { delay: opcoes.delay } : {}),
    ...(opcoes?.readmessages ? { readmessages: true } : {}),
  })
}

export async function enviarImagem(
  config: ConfigWhatsapp,
  numero: string,
  url: string,
  legenda?: string
): Promise<void> {
  await requisicaoUazapi(config, "/send/media", {
    number: numero,
    media: url,
    caption: legenda || "",
  })
}

export async function simularDigitando(
  config: ConfigWhatsapp,
  numero: string
): Promise<void> {
  await requisicaoUazapi(config, "/message/presence", {
    number: numero,
    presence: "composing",
  })
}

export async function pararDigitando(
  config: ConfigWhatsapp,
  numero: string
): Promise<void> {
  await requisicaoUazapi(config, "/message/presence", {
    number: numero,
    presence: "paused",
  })
}

export async function marcarComoLida(
  config: ConfigWhatsapp,
  chatid: string
): Promise<void> {
  await requisicaoUazapi(config, "/chat/read", {
    number: chatid,
    read: true,
  })
}

// ============================================================
// Utilitários
// ============================================================

/**
 * Testa se as credenciais admin da Uazapi são válidas.
 * Faz um GET em /instance/list para verificar conectividade e autenticação.
 */
export async function testarConexaoUazapi(url: string, adminToken: string): Promise<boolean> {
  try {
    const resposta = await fetch(montarUrlBase(url, "/instance/list"), {
      method: "GET",
      headers: { "Content-Type": "application/json", admintoken: adminToken },
    })
    return resposta.ok
  } catch {
    return false
  }
}

/**
 * Extrai o número limpo do remoteJid da Uazapi
 * Ex: "5511999999999@s.whatsapp.net" → "5511999999999"
 */
export function extrairNumero(remoteJid: string): string {
  return remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "")
}

/**
 * Verifica se o remoteJid é de um grupo
 */
export function ehGrupo(remoteJid: string): boolean {
  return remoteJid.endsWith("@g.us")
}

/**
 * Baixa mídia do WhatsApp via Uazapi
 */
export async function baixarMidia(
  config: ConfigWhatsapp,
  messageId: string
): Promise<Buffer> {
  const resposta = await fetch(
    montarUrl(config, `/chat/downloadMedia/${messageId}`),
    { headers: montarHeaders(config) }
  )

  if (!resposta.ok) {
    throw new Error(`Erro ao baixar mídia: ${resposta.status}`)
  }

  const arrayBuffer = await resposta.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
