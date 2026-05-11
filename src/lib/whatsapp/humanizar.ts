import type { ConfigWhatsapp } from "@/types/whatsapp"
import { enviarTexto, simularDigitando, pararDigitando } from "./uazapi"

// ============================================================
// Envio humanizado de mensagens
// Simula comportamento humano: leitura → digitando → envio por partes
// Padrão: Laura/Remax (anti-bloqueio + naturalidade)
// ============================================================

/**
 * Aguarda um tempo em milissegundos
 */
function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Gera número aleatório entre min e max
 */
function randomEntre(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Calcula o delay de digitação proporcional ao tamanho do texto
 * ~50ms por caractere, com limites min/max e jitter aleatório
 */
export function calcularDelayDigitacao(texto: string): number {
  const charCount = texto.length
  const baseTime = charCount / 50 // ~50ms por caractere em segundos

  // Limites: mínimo 1.5s, máximo 6s
  const clampado = Math.max(1.5, Math.min(baseTime, 6))

  // Jitter: ±25% de variação para parecer natural
  const jitter = randomEntre(0.75, 1.25)
  return Math.round(clampado * jitter * 1000)
}

/**
 * Calcula delay entre segmentos de uma mesma resposta
 * Varia de 1 a 3 segundos com fator de comprimento
 */
function calcularDelayEntreSegmentos(texto: string, indice: number): number {
  const base = randomEntre(1.0, 3.0)
  const fatorComprimento = Math.min(texto.length / 400, 1.0) * 0.5
  let delay = base + fatorComprimento

  // Primeiro segmento é mais rápido
  if (indice === 0) delay *= 0.7

  // De madrugada (22h-7h) fica mais lento
  const hora = new Date().getHours()
  if (hora >= 22 || hora < 7) {
    delay *= randomEntre(1.2, 1.6)
  }

  return Math.round(delay * 1000)
}

/**
 * Simula tempo de "leitura" antes de começar a digitar
 */
function calcularDelayLeitura(): number {
  return Math.round(randomEntre(0.5, 2.0) * 1000)
}

/**
 * Quebra uma mensagem longa em partes menores e naturais.
 * Prioridade:
 *   1. Split por `---` em linha própria (delimitador explícito da IA)
 *   2. Split por parágrafo duplo (\n\n)
 *   3. Split por frase (. ! ?)
 *   4. Split por linha simples
 *   5. Corte por tamanho (último recurso)
 */
export function quebrarMensagem(texto: string, maxCaracteres = 500): string[] {
  // Prioridade 1: split por --- em linha própria (delimitador explícito da IA)
  if (/(?:^|\n)\s*---\s*(?:\n|$)/.test(texto)) {
    const blocos = texto
      .split(/(?:^|\n)\s*---\s*(?:\n|$)/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0)
    // Se algum bloco ainda ficou grande demais, aplica quebra secundária
    const resultado: string[] = []
    for (const bloco of blocos) {
      if (bloco.length <= maxCaracteres) {
        resultado.push(bloco)
      } else {
        resultado.push(...quebrarMensagemSemDelimitador(bloco, maxCaracteres))
      }
    }
    return resultado
  }

  return quebrarMensagemSemDelimitador(texto, maxCaracteres)
}

function quebrarMensagemSemDelimitador(texto: string, maxCaracteres: number): string[] {
  if (texto.length <= maxCaracteres) {
    return [texto]
  }

  // Tenta quebrar por parágrafos (dupla quebra de linha)
  const paragrafos = texto.split(/\n\n+/)
  if (paragrafos.length > 1) {
    return agruparPartes(paragrafos, maxCaracteres)
  }

  // Tenta quebrar por frases (ponto final seguido de espaço)
  const frases = texto.split(/(?<=[.!?])\s+/)
  if (frases.length > 1) {
    return agruparPartes(frases, maxCaracteres)
  }

  // Último recurso: quebra por quebra de linha simples
  const linhas = texto.split(/\n/)
  if (linhas.length > 1) {
    return agruparPartes(linhas, maxCaracteres)
  }

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
 * LYNEDES-103 Sprint 3: burst cooldown anti-bloqueio
 * Quando enviamos muitos segmentos seguidos, WhatsApp pode rate-limitar.
 * Pausa extra de 5s quando passa de 5 segmentos (alinhado com o Python).
 */
const BURST_THRESHOLD = 5
const BURST_COOLDOWN_MS = 5_000

/**
 * Envia mensagem de forma humanizada:
 * 1. Simula tempo de leitura (0.5-2s)
 * 2. Para cada segmento: mostra "digitando..." → espera proporcional → envia
 * 3. Entre segmentos: delay aleatório de 1-3s
 * 4. Burst cooldown: pausa extra a cada BURST_THRESHOLD segmentos
 * 5. No final: para de "digitar"
 */
export async function enviarHumanizado(
  config: ConfigWhatsapp,
  numero: string,
  texto: string
): Promise<void> {
  const partes = quebrarMensagem(texto)

  // Simular tempo de leitura antes de começar a digitar
  await aguardar(calcularDelayLeitura())

  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i]
    const delayDigitacao = calcularDelayDigitacao(parte)

    // Mostrar "digitando..." pro cliente
    try {
      await simularDigitando(config, numero)
    } catch {
      // Não falhar o envio se presença der erro
    }

    // Esperar o tempo proporcional ao texto (simula digitação)
    await aguardar(delayDigitacao)

    // Enviar a mensagem
    await enviarTexto(config, numero, parte, {
      readmessages: i === 0, // Marca como lida na primeira parte
    })

    // Se tem mais partes, espera antes da próxima
    if (i < partes.length - 1) {
      await aguardar(calcularDelayEntreSegmentos(parte, i))

      // Burst cooldown: a cada BURST_THRESHOLD segmentos, pausa extra
      const segmentosEnviados = i + 1
      if (segmentosEnviados % BURST_THRESHOLD === 0) {
        console.log(
          `[Humanizar] Burst cooldown apos ${segmentosEnviados} segmentos — pausando ${BURST_COOLDOWN_MS}ms`
        )
        await aguardar(BURST_COOLDOWN_MS)
      }
    }
  }

  // Parar de "digitar" após enviar tudo
  try {
    await pararDigitando(config, numero)
  } catch {
    // Não falhar se presença der erro
  }
}
