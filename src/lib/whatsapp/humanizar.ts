import type { ConfigWhatsapp } from "@/types/whatsapp"
import { enviarTexto } from "./uazapi"

// ============================================================
// Envio humanizado de mensagens
// Simula digitação, quebra mensagens longas e adiciona delays
// ============================================================

/**
 * Aguarda um tempo em milissegundos
 */
function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calcula o delay de digitação baseado no tamanho do texto
 * Mensagem curta (< 50 chars): 1s
 * Mensagem média (50-200 chars): 2s
 * Mensagem longa (> 200 chars): 3s
 */
export function calcularDelayDigitacao(texto: string): number {
  const tamanho = texto.length
  if (tamanho < 50) return 1000
  if (tamanho <= 200) return 2000
  return 3000
}

/**
 * Quebra uma mensagem longa em partes menores e naturais
 * Tenta quebrar em parágrafos ou frases, não no meio de palavras
 */
export function quebrarMensagem(texto: string, maxCaracteres = 500): string[] {
  // Se cabe em uma mensagem, retorna direto
  if (texto.length <= maxCaracteres) {
    return [texto]
  }

  // Tenta quebrar por parágrafos (dupla quebra de linha)
  const paragrafos = texto.split(/\n\n+/)
  if (paragrafos.length > 1) {
    return agruparPartes(paragrafos, maxCaracteres)
  }

  // Tenta quebrar por frases (ponto final seguido de espaço)
  const frases = texto.split(/(?<=\.)\s+/)
  if (frases.length > 1) {
    return agruparPartes(frases, maxCaracteres)
  }

  // Último recurso: quebra por quebra de linha simples
  const linhas = texto.split(/\n/)
  if (linhas.length > 1) {
    return agruparPartes(linhas, maxCaracteres)
  }

  // Se não conseguiu quebrar naturalmente, divide por tamanho
  return dividirPorTamanho(texto, maxCaracteres)
}

/**
 * Agrupa partes menores em blocos que cabem no maxCaracteres
 */
function agruparPartes(partes: string[], maxCaracteres: number): string[] {
  const resultado: string[] = []
  let blocoAtual = ""

  for (const parte of partes) {
    const separador = blocoAtual ? "\n\n" : ""
    if ((blocoAtual + separador + parte).length > maxCaracteres && blocoAtual) {
      resultado.push(blocoAtual.trim())
      blocoAtual = parte
    } else {
      blocoAtual += separador + parte
    }
  }

  if (blocoAtual.trim()) {
    resultado.push(blocoAtual.trim())
  }

  return resultado
}

/**
 * Divide texto por tamanho, tentando não cortar palavras
 */
function dividirPorTamanho(texto: string, maxCaracteres: number): string[] {
  const partes: string[] = []
  let restante = texto

  while (restante.length > maxCaracteres) {
    let pontoCorte = restante.lastIndexOf(" ", maxCaracteres)
    if (pontoCorte === -1) pontoCorte = maxCaracteres
    partes.push(restante.substring(0, pontoCorte).trim())
    restante = restante.substring(pontoCorte).trim()
  }

  if (restante) {
    partes.push(restante)
  }

  return partes
}

/**
 * Envia mensagem de forma humanizada:
 * Usa o parâmetro `delay` nativo da Uazapi — mostra "Digitando..." automaticamente
 * antes do envio. Na primeira parte, marca as mensagens anteriores como lidas.
 * Se a mensagem for longa, quebra em partes com 1s entre cada.
 */
export async function enviarHumanizado(
  config: ConfigWhatsapp,
  numero: string,
  texto: string
): Promise<void> {
  const partes = quebrarMensagem(texto)

  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i]
    const delay = calcularDelayDigitacao(parte)

    await enviarTexto(config, numero, parte, {
      delay,
      readmessages: i === 0,
    })

    // Se tem mais partes, espera 1s antes da próxima
    if (i < partes.length - 1) {
      await aguardar(1000)
    }
  }
}
