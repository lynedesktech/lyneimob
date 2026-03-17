import { z } from "zod"

// ============================================================
// Schema e tipos das configurações de integrações
// ============================================================

export const schemaConfiguracoesIntegracoes = z.object({
  // OpenAI
  openai_api_key: z.string().min(8, "Chave muito curta").optional(),

  // Stripe
  stripe_secret_key: z.string().min(8, "Chave muito curta").optional(),
  stripe_publishable_key: z.string().min(8, "Chave muito curta").optional(),
  stripe_webhook_secret: z.string().min(8, "Chave muito curta").optional(),

  // WhatsApp (Uazapi)
  uazapi_url: z.string().min(8, "URL muito curta").optional(),
  uazapi_token: z.string().min(8, "Token muito curto").optional(),

  // Upstash Redis
  upstash_redis_url: z.string().min(8, "URL muito curta").optional(),
  upstash_redis_token: z.string().min(8, "Token muito curto").optional(),
})

export type ConfiguracoesIntegracoes = z.infer<typeof schemaConfiguracoesIntegracoes>

// ============================================================
// Nomes legíveis dos campos (para UI)
// ============================================================

export const nomesChaves: Record<keyof ConfiguracoesIntegracoes, string> = {
  openai_api_key: "Chave da API",
  stripe_secret_key: "Chave secreta (Secret Key)",
  stripe_publishable_key: "Chave pública (Publishable Key)",
  stripe_webhook_secret: "Segredo do Webhook",
  uazapi_url: "URL da API",
  uazapi_token: "Token de acesso",
  upstash_redis_url: "URL do Redis",
  upstash_redis_token: "Token do Redis",
}

/**
 * Textos de ajuda exibidos abaixo de cada campo no formulário.
 * Explica onde encontrar cada credencial.
 */
export const ajudaChaves: Partial<Record<keyof ConfiguracoesIntegracoes, string>> = {
  openai_api_key: "Encontre em platform.openai.com → API keys. Começa com sk-...",
  stripe_secret_key: "Encontre em dashboard.stripe.com → Developers → API keys. Começa com sk_live_ ou sk_test_.",
  stripe_publishable_key: "Encontre em dashboard.stripe.com → Developers → API keys. Começa com pk_live_ ou pk_test_.",
  stripe_webhook_secret: "Criado ao configurar um endpoint de webhook em dashboard.stripe.com → Developers → Webhooks. Começa com whsec_. Pode deixar em branco se ainda não configurou webhooks.",
  uazapi_url: "URL da sua instância Uazapi, ex: https://api.uazapi.dev",
  uazapi_token: "Token de acesso gerado no painel Uazapi.",
  upstash_redis_url: "Encontre em console.upstash.com → seu banco Redis → REST API → UPSTASH_REDIS_REST_URL.",
  upstash_redis_token: "Encontre em console.upstash.com → seu banco Redis → REST API → UPSTASH_REDIS_REST_TOKEN.",
}

// ============================================================
// Agrupamento por integração (para tabs)
// ============================================================

export type GrupoIntegracao = {
  id: string
  nome: string
  descricao: string
  campos: (keyof ConfiguracoesIntegracoes)[]
}

export const gruposIntegracoes: GrupoIntegracao[] = [
  {
    id: "stripe",
    nome: "Stripe",
    descricao: "Cobrança recorrente, checkout e portal do cliente. Configure suas chaves para ativar o billing.",
    campos: ["stripe_secret_key", "stripe_publishable_key", "stripe_webhook_secret"],
  },
  {
    id: "openai",
    nome: "OpenAI",
    descricao: "Inteligência artificial para análise de imóveis, clientes e negócios. Usada em todos os módulos de IA.",
    campos: ["openai_api_key"],
  },
  {
    id: "whatsapp",
    nome: "WhatsApp (Uazapi)",
    descricao: "Agente SDR que atende leads automaticamente via WhatsApp. Precisa de uma conta Uazapi configurada.",
    campos: ["uazapi_url", "uazapi_token"],
  },
  {
    id: "redis",
    nome: "Upstash Redis",
    descricao: "Cache e filas para o agente WhatsApp. Necessário para debounce de mensagens e memória de conversa.",
    campos: ["upstash_redis_url", "upstash_redis_token"],
  },
]

// ============================================================
// Funções de máscara (segurança)
// ============================================================

/**
 * Mascara uma chave de API, mostrando só os últimos 4 caracteres.
 * Ex: "sk_live_abc123xyz789" → "••••x789"
 */
export function mascararChave(chave: string): string {
  if (!chave || chave.length < 4) return "••••"
  return "••••" + chave.slice(-4)
}

/**
 * Tipo retornado ao mascarar — cada campo tem valor mascarado e flag se existe.
 */
export type IntegracoesMascaradas = {
  [K in keyof ConfiguracoesIntegracoes]: {
    mascarada: string
    temChave: boolean
  }
}

/**
 * Pega o JSONB do banco e retorna objeto com valores mascarados + flags.
 * Nunca retorna o valor real — seguro para enviar ao Client Component.
 */
export function extrairIntegracoesMascaradas(
  jsonb: Record<string, unknown> | null | undefined
): IntegracoesMascaradas {
  const dados = (jsonb ?? {}) as Record<string, string>

  const resultado = {} as IntegracoesMascaradas

  const campos = Object.keys(schemaConfiguracoesIntegracoes.shape) as (keyof ConfiguracoesIntegracoes)[]

  for (const campo of campos) {
    const valor = dados[campo]
    resultado[campo] = {
      mascarada: valor ? mascararChave(valor) : "",
      temChave: !!valor && valor.length > 0,
    }
  }

  return resultado
}
