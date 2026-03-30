// ============================================================
// Verificação de saúde das integrações
// Testa conexão real com cada API externa
// ============================================================

export type StatusIntegracao = "conectado" | "desconectado" | "nao_configurado"

export type ItemSaude = {
  status: StatusIntegracao
  mensagem?: string
}

export type SaudeIntegracoes = {
  stripe: ItemSaude
  openai: ItemSaude
  uazapi: ItemSaude
  redis: ItemSaude
  verificado_em: string
}

type Credenciais = {
  stripe_secret_key?: string
  openai_api_key?: string
  uazapi_url?: string
  uazapi_token?: string
  upstash_redis_url?: string
  upstash_redis_token?: string
}

const TIMEOUT_MS = 5000

async function comTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)

  try {
    const resultado = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(new Error("Timeout"))
        )
      }),
    ])
    return resultado
  } finally {
    clearTimeout(timer)
  }
}

async function verificarStripe(chave?: string): Promise<ItemSaude> {
  if (!chave) return { status: "nao_configurado" }

  try {
    const resp = await comTimeout(
      fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${chave}` },
      }),
      TIMEOUT_MS
    )

    if (resp.status === 401) return { status: "desconectado", mensagem: "Chave inválida" }
    if (resp.ok) return { status: "conectado" }
    return { status: "desconectado", mensagem: `Erro ${resp.status}` }
  } catch (erro) {
    const mensagem = erro instanceof Error && erro.message === "Timeout"
      ? "Timeout ao conectar"
      : "Erro de conexão"
    return { status: "desconectado", mensagem }
  }
}

async function verificarOpenAI(chave?: string): Promise<ItemSaude> {
  if (!chave) return { status: "nao_configurado" }

  try {
    const resp = await comTimeout(
      fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${chave}` },
      }),
      TIMEOUT_MS
    )

    if (resp.status === 401) return { status: "desconectado", mensagem: "Chave inválida" }
    if (resp.ok) return { status: "conectado" }
    return { status: "desconectado", mensagem: `Erro ${resp.status}` }
  } catch (erro) {
    const mensagem = erro instanceof Error && erro.message === "Timeout"
      ? "Timeout ao conectar"
      : "Erro de conexão"
    return { status: "desconectado", mensagem }
  }
}

async function verificarRedis(url?: string, token?: string): Promise<ItemSaude> {
  if (!url || !token) return { status: "nao_configurado" }

  try {
    const urlLimpa = url.replace(/\/$/, "")
    const resp = await comTimeout(
      fetch(`${urlLimpa}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      TIMEOUT_MS
    )

    if (resp.status === 401) return { status: "desconectado", mensagem: "Token inválido" }
    if (resp.ok) return { status: "conectado" }
    return { status: "desconectado", mensagem: `Erro ${resp.status}` }
  } catch (erro) {
    const mensagem = erro instanceof Error && erro.message === "Timeout"
      ? "Timeout ao conectar"
      : "Erro de conexão"
    return { status: "desconectado", mensagem }
  }
}

async function verificarUazapi(url?: string, token?: string): Promise<ItemSaude> {
  if (!url || !token) return { status: "nao_configurado" }

  try {
    const urlLimpa = url.replace(/\/$/, "")
    const resp = await comTimeout(
      fetch(`${urlLimpa}/instance/list`, {
        method: "GET",
        headers: { "Content-Type": "application/json", admintoken: token },
      }),
      10000 // 10s — servidores próprios podem demorar mais
    )

    if (resp.ok) return { status: "conectado" }
    if (resp.status === 401 || resp.status === 403) {
      return { status: "desconectado", mensagem: "Token inválido ou sem permissão" }
    }
    if (resp.status === 404) {
      return { status: "desconectado", mensagem: "URL inválida — verifique o endereço do servidor" }
    }
    return { status: "desconectado", mensagem: `Erro ${resp.status} — servidor indisponível` }
  } catch (erro) {
    const mensagem = erro instanceof Error && erro.message === "Timeout"
      ? "Timeout ao conectar (10s)"
      : "Erro de conexão"
    return { status: "desconectado", mensagem }
  }
}

/**
 * Verifica saúde de todas as integrações em paralelo.
 * Cada verificação tem timeout de 5s para não travar.
 */
export async function verificarSaudeIntegracoes(
  credenciais: Credenciais
): Promise<SaudeIntegracoes> {
  const [stripe, openai, redis, uazapi] = await Promise.all([
    verificarStripe(credenciais.stripe_secret_key),
    verificarOpenAI(credenciais.openai_api_key),
    verificarRedis(credenciais.upstash_redis_url, credenciais.upstash_redis_token),
    verificarUazapi(credenciais.uazapi_url, credenciais.uazapi_token),
  ])

  return {
    stripe,
    openai,
    uazapi,
    redis,
    verificado_em: new Date().toISOString(),
  }
}
