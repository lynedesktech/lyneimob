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
  const { getOpenAI } = await import("@/lib/openai")
  const arquivo = new File([new Uint8Array(buffer)], "audio.ogg", { type: "audio/ogg" })

  const transcricao = await getOpenAI().audio.transcriptions.create({
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

  const { getOpenAI } = await import("@/lib/openai")
  const resposta = await getOpenAI().chat.completions.create({
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
 * Usa pdf-parse para PDFs, fallback para UTF-8 para outros formatos
 */
export async function extrairTextoDocumento(
  config: ConfigWhatsapp,
  messageId: string,
  nomeArquivo?: string
): Promise<string> {
  const buffer = await baixarMidia(config, messageId)
  const extensao = nomeArquivo?.split(".").pop()?.toLowerCase() || ""

  // Tentar parsing de PDF se for PDF ou se o buffer começa com %PDF
  const ehPdf = extensao === "pdf" || buffer.slice(0, 5).toString() === "%PDF-"
  if (ehPdf) {
    try {
      const mod = await import("pdf-parse")
      const pdfParseFn = ("default" in mod ? mod.default : mod) as (buf: Buffer) => Promise<{ text: string }>
      const resultado = await pdfParseFn(buffer)
      const texto = resultado.text?.trim()
      if (texto && texto.length > 20) {
        return texto.substring(0, 4000)
      }
    } catch {
      // Se pdf-parse falhar, continuar para fallback
    }
  }

  // Fallback: tentar extrair texto simples do buffer (txt, csv, etc.)
  const texto = buffer.toString("utf-8")
  const textoLimpo = texto.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, "").trim()

  if (textoLimpo.length > 50) {
    return textoLimpo.substring(0, 4000)
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
