import { baixarMidia } from "./uazapi"
import type { ConfigWhatsapp, TipoConteudo, MensagemProcessada } from "@/types/whatsapp"

// ============================================================
// Processamento de mídia do WhatsApp
// Converte áudio, imagem, documento e vídeo em texto
// para a IA processar na conversa
// ============================================================

/**
 * Transcreve áudio do WhatsApp usando OpenAI Whisper
 */
export async function transcreverAudio(
  config: ConfigWhatsapp,
  messageId: string
): Promise<string> {
  const buffer = await baixarMidia(config, messageId)

  // Criar File a partir do buffer para a API do Whisper
  const { openai } = await import("@/lib/openai")
  const arquivo = new File([new Uint8Array(buffer)], "audio.ogg", { type: "audio/ogg" })

  const transcricao = await openai.audio.transcriptions.create({
    file: arquivo,
    model: "whisper-1",
    language: "pt",
  })

  return transcricao.text
}

/**
 * Analisa imagem do WhatsApp usando GPT-4o-mini Vision
 * Retorna descrição objetiva em português
 */
export async function analisarImagem(
  config: ConfigWhatsapp,
  messageId: string
): Promise<string> {
  const buffer = await baixarMidia(config, messageId)

  // Converter para base64 data URL
  const base64 = buffer.toString("base64")
  const dataUrl = `data:image/jpeg;base64,${base64}`

  const { openai } = await import("@/lib/openai")
  const resposta = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Descreva esta imagem de forma objetiva e concisa em português brasileiro. Se for uma foto de imóvel, destaque os detalhes relevantes (tipo, cômodo, acabamento, estado).",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    max_tokens: 300,
  })

  return resposta.choices[0]?.message?.content || "Imagem recebida (não foi possível analisar)"
}

/**
 * Extrai texto de documento/PDF
 * Para MVP, faz extração simples — sem dependência externa de PDF parser
 */
export async function extrairTextoDocumento(
  config: ConfigWhatsapp,
  messageId: string,
  nomeArquivo?: string
): Promise<string> {
  const buffer = await baixarMidia(config, messageId)

  // Tentar extrair texto simples do buffer
  const texto = buffer.toString("utf-8")

  // Se o texto tem conteúdo legível, retornar
  // Caso contrário, retornar indicação do arquivo recebido
  const textoLimpo = texto.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, "").trim()

  if (textoLimpo.length > 50) {
    // Limitar a 2000 chars para não sobrecarregar a IA
    return textoLimpo.substring(0, 2000)
  }

  return `Documento recebido: ${nomeArquivo || "arquivo"}. Conteúdo não pôde ser extraído automaticamente.`
}

/**
 * Função orquestradora — recebe o tipo de conteúdo e delega
 * para a função específica de processamento
 */
export async function processarConteudo(
  config: ConfigWhatsapp,
  messageId: string,
  tipo: TipoConteudo,
  conteudoTexto: string | null,
  nomeArquivo?: string
): Promise<MensagemProcessada> {
  try {
    switch (tipo) {
      case "audio": {
        const transcricao = await transcreverAudio(config, messageId)
        return {
          tipo: "audio",
          conteudo: transcricao,
          conteudo_original: "[Áudio]",
          metadata: { transcrito: true },
        }
      }

      case "imagem": {
        const descricao = await analisarImagem(config, messageId)
        return {
          tipo: "imagem",
          conteudo: conteudoTexto
            ? `${conteudoTexto}\n\n[Descrição da imagem: ${descricao}]`
            : `[Descrição da imagem: ${descricao}]`,
          conteudo_original: conteudoTexto || "[Imagem]",
          metadata: { analisada: true },
        }
      }

      case "documento": {
        const textoExtraido = await extrairTextoDocumento(config, messageId, nomeArquivo)
        return {
          tipo: "documento",
          conteudo: textoExtraido,
          conteudo_original: `[Documento: ${nomeArquivo || "arquivo"}]`,
          metadata: { extraido: true, nome_arquivo: nomeArquivo },
        }
      }

      case "video": {
        // Vídeo: usar apenas a legenda se tiver
        return {
          tipo: "video",
          conteudo: conteudoTexto || "[Vídeo recebido]",
          conteudo_original: conteudoTexto || "[Vídeo]",
        }
      }

      case "sticker": {
        return {
          tipo: "sticker",
          conteudo: "[Sticker recebido]",
          conteudo_original: "[Sticker]",
        }
      }

      case "localizacao": {
        return {
          tipo: "localizacao",
          conteudo: conteudoTexto || "[Localização recebida]",
          conteudo_original: conteudoTexto || "[Localização]",
        }
      }

      case "texto":
      default: {
        return {
          tipo: "texto",
          conteudo: conteudoTexto || "",
          conteudo_original: conteudoTexto || "",
        }
      }
    }
  } catch (erro) {
    console.error(`[Processar Mídia] Erro ao processar (${tipo}):`, erro instanceof Error ? erro.message : erro)

    // Fallback: retornar indicação do tipo sem processamento
    return {
      tipo,
      conteudo: conteudoTexto || `[${tipo} recebido — erro ao processar]`,
      conteudo_original: conteudoTexto || `[${tipo}]`,
      metadata: { erro_processamento: true },
    }
  }
}
