"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { getOpenAI } from "@/lib/openai"
import { verificarLimiteConversasIA, registrarUsoConversaIA } from "@/lib/verificar-limites"
import type { EstadoFormulario } from "@/types/formulario"
import { labelsTipoImovel } from "@/lib/constantes"

async function buscarDadosImovel(imovelId: string) {
  const supabase = await criarClienteServer()
  const { data } = await supabase
    .from("imoveis")
    .select("*")
    .eq("id", imovelId)
    .single()
  return data
}

function montarContextoImovel(imovel: Record<string, unknown>): string {
  const partes: string[] = []

  partes.push(`Tipo: ${labelsTipoImovel[imovel.tipo as string] ?? imovel.tipo}`)
  partes.push(`Localização: ${imovel.bairro ? `${imovel.bairro}, ` : ""}${imovel.cidade} - ${imovel.estado}`)

  if (imovel.area_total) partes.push(`Área total: ${imovel.area_total}m²`)
  if (imovel.area_construida) partes.push(`Área construída: ${imovel.area_construida}m²`)
  if ((imovel.quartos as number) > 0) partes.push(`Quartos: ${imovel.quartos}`)
  if ((imovel.suites as number) > 0) partes.push(`Suítes: ${imovel.suites}`)
  if ((imovel.banheiros as number) > 0) partes.push(`Banheiros: ${imovel.banheiros}`)
  if ((imovel.vagas as number) > 0) partes.push(`Vagas de garagem: ${imovel.vagas}`)
  if (imovel.andares) partes.push(`Andares: ${imovel.andares}`)

  if (imovel.valor) {
    partes.push(`Preço de venda: R$ ${Number(imovel.valor).toLocaleString("pt-BR")}`)
  }
  if (imovel.valor_aluguel) {
    partes.push(`Aluguel: R$ ${Number(imovel.valor_aluguel).toLocaleString("pt-BR")}/mês`)
  }
  if (imovel.condominio) {
    partes.push(`Condomínio: R$ ${Number(imovel.condominio).toLocaleString("pt-BR")}/mês`)
  }

  if (imovel.descricao) partes.push(`Descrição atual: ${imovel.descricao}`)

  return partes.join("\n")
}

// ============================================================
// Gerar descrição com IA
// ============================================================

export async function gerarDescricaoIA(
  imovelId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const imovel = await buscarDadosImovel(imovelId)
  if (!imovel) return { erro: "Imóvel não encontrado" }

  // Verificar limite de conversas IA do plano
  const limite = await verificarLimiteConversasIA(imovel.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um redator especializado em anúncios imobiliários no Brasil. " +
            "Escreva descrições atrativas, profissionais e detalhadas. " +
            "Use português brasileiro. Não invente informações que não foram fornecidas. " +
            "Destaque os pontos fortes do imóvel. Escreva em 2-4 parágrafos.",
        },
        {
          role: "user",
          content: `Gere uma descrição atrativa para este imóvel:\n\n${montarContextoImovel(imovel)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const texto = resposta.choices[0]?.message?.content?.trim()
    if (!texto) return { erro: "A IA não retornou texto" }

    await registrarUsoConversaIA(imovel.organizacao_id)
    return { sucesso: "Descrição gerada com sucesso", texto }
  } catch {
    return { erro: "Erro ao gerar descrição. Verifique sua chave da OpenAI." }
  }
}

// ============================================================
// Melhorar texto existente
// ============================================================

export async function melhorarTextoIA(
  texto: string,
  imovelId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const imovel = await buscarDadosImovel(imovelId)
  if (!imovel) return { erro: "Imóvel não encontrado" }

  const limite = await verificarLimiteConversasIA(imovel.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um editor especializado em anúncios imobiliários. " +
            "Melhore o texto mantendo as informações originais. " +
            "Torne-o mais atrativo, profissional e persuasivo. " +
            "Use português brasileiro. Não adicione informações que não estavam no original.",
        },
        {
          role: "user",
          content: `Melhore esta descrição de imóvel:\n\n${texto}\n\nContexto do imóvel:\n${montarContextoImovel(imovel)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const textoMelhorado = resposta.choices[0]?.message?.content?.trim()
    if (!textoMelhorado) return { erro: "A IA não retornou texto" }

    await registrarUsoConversaIA(imovel.organizacao_id)
    return { sucesso: "Texto melhorado com sucesso", texto: textoMelhorado }
  } catch {
    return { erro: "Erro ao melhorar texto. Verifique sua chave da OpenAI." }
  }
}

// ============================================================
// Gerar título com IA
// ============================================================

export async function gerarTituloIA(
  imovelId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const imovel = await buscarDadosImovel(imovelId)
  if (!imovel) return { erro: "Imóvel não encontrado" }

  const limite = await verificarLimiteConversasIA(imovel.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um redator de anúncios imobiliários. " +
            "Gere um título curto (máximo 80 caracteres) e atrativo para o anúncio. " +
            "O título deve destacar os principais diferenciais do imóvel. " +
            "Use português brasileiro. Retorne APENAS o título, sem aspas.",
        },
        {
          role: "user",
          content: `Gere um título de anúncio para este imóvel:\n\n${montarContextoImovel(imovel)}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 100,
    })

    const titulo = resposta.choices[0]?.message?.content?.trim()
    if (!titulo) return { erro: "A IA não retornou texto" }

    await registrarUsoConversaIA(imovel.organizacao_id)
    return { sucesso: "Título gerado com sucesso", texto: titulo }
  } catch {
    return { erro: "Erro ao gerar título. Verifique sua chave da OpenAI." }
  }
}

// ============================================================
// Salvar texto de IA no imóvel
// ============================================================

export async function salvarTextoIA(
  imovelId: string,
  campo: "titulo_ia" | "descricao_ia",
  texto: string
): Promise<EstadoFormulario> {
  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("imoveis")
    .update({ [campo]: texto })
    .eq("id", imovelId)

  if (error) return { erro: "Erro ao salvar texto" }

  revalidatePath(`/imoveis/${imovelId}`)
  return { sucesso: "Texto salvo com sucesso" }
}
