import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const ALGORITMO = "aes-256-gcm"

function obterChave(): Buffer {
  const segredo = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  return scryptSync(segredo, "lyneimob-salt", 32)
}

/**
 * Criptografa um texto usando AES-256-GCM.
 * Retorna string no formato: iv:authTag:dadosCriptografados (tudo em hex)
 */
export function criptografar(texto: string): string {
  const chave = obterChave()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITMO, chave, iv)

  let criptografado = cipher.update(texto, "utf8", "hex")
  criptografado += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")

  return `${iv.toString("hex")}:${authTag}:${criptografado}`
}

/**
 * Descriptografa um texto criptografado com criptografar().
 * Espera string no formato: iv:authTag:dadosCriptografados
 */
export function descriptografar(textoCriptografado: string): string {
  const chave = obterChave()
  const [ivHex, authTagHex, dados] = textoCriptografado.split(":")

  if (!ivHex || !authTagHex || !dados) {
    throw new Error("Formato de dados criptografados inválido")
  }

  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const decipher = createDecipheriv(ALGORITMO, chave, iv)
  decipher.setAuthTag(authTag)

  let descriptografado = decipher.update(dados, "hex", "utf8")
  descriptografado += decipher.final("utf8")

  return descriptografado
}

/**
 * Verifica se uma string parece estar criptografada (formato iv:tag:dados)
 */
export function estaCriptografada(texto: string): boolean {
  const partes = texto.split(":")
  return partes.length === 3 && partes[0].length === 32 && partes[1].length === 32
}

// ============================================================
// Criptografia de credenciais de integrações
// ============================================================

const CAMPOS_SENSIVEIS = [
  "openai_api_key",
  "stripe_secret_key",
  "stripe_webhook_secret",
  "uazapi_token",
  "upstash_redis_token",
]

export function criptografarCredenciais(dados: Record<string, string>): Record<string, string> {
  const resultado = { ...dados }
  for (const campo of CAMPOS_SENSIVEIS) {
    if (resultado[campo] && !estaCriptografada(resultado[campo])) {
      resultado[campo] = criptografar(resultado[campo])
    }
  }
  return resultado
}

export function descriptografarCredenciais(dados: Record<string, string>): Record<string, string> {
  const resultado = { ...dados }
  for (const campo of CAMPOS_SENSIVEIS) {
    if (resultado[campo] && estaCriptografada(resultado[campo])) {
      try {
        resultado[campo] = descriptografar(resultado[campo])
      } catch {
        // Se falhar a descriptografia, manter o valor original
      }
    }
  }
  return resultado
}
