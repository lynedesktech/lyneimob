"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { getOpenAI } from "@/lib/openai"
import { verificarLimiteConversasIA, registrarUsoConversaIA } from "@/lib/verificar-limites"
import type { EstadoFormulario } from "@/types/formulario"

async function buscarDadosLoteamento(loteamentoId: string) {
  const supabase = await criarClienteServer()
  const { data } = await supabase
    .from("loteamentos")
    .select("*")
    .eq("id", loteamentoId)
    .single()
  return data
}

function montarContextoLoteamento(loteamento: Record<string, unknown>): string {
  const partes: string[] = []

  partes.push(`Nome: ${loteamento.nome}`)
  partes.push(`Localização: ${loteamento.bairro ? `${loteamento.bairro}, ` : ""}${loteamento.cidade} - ${loteamento.estado}`)

  if (loteamento.total_lotes) partes.push(`Total de lotes: ${loteamento.total_lotes}`)
  if (loteamento.lotes_disponiveis) partes.push(`Lotes disponíveis: ${loteamento.lotes_disponiveis}`)
  if (loteamento.lotes_reservados) partes.push(`Lotes reservados: ${loteamento.lotes_reservados}`)
  if (loteamento.lotes_vendidos) partes.push(`Lotes vendidos: ${loteamento.lotes_vendidos}`)

  if (loteamento.valor_total) {
    partes.push(`Valor total: R$ ${Number(loteamento.valor_total).toLocaleString("pt-BR")}`)
  }

  if (loteamento.descricao) partes.push(`Descrição atual: ${loteamento.descricao}`)

  return partes.join("\n")
}

// ============================================================
// Gerar descrição com IA
// ============================================================

export async function gerarDescricaoLoteamentoIA(
  loteamentoId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const loteamento = await buscarDadosLoteamento(loteamentoId)
  if (!loteamento) return { erro: "Loteamento não encontrado" }

  const limite = await verificarLimiteConversasIA(loteamento.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um redator especializado em empreendimentos imobiliários e loteamentos no Brasil. " +
            "Escreva descrições atrativas, profissionais e detalhadas para loteamentos. " +
            "Use português brasileiro. Não invente informações que não foram fornecidas. " +
            "Destaque os pontos fortes do empreendimento: localização, infraestrutura, oportunidade de investimento. " +
            "Escreva em 2-4 parágrafos.",
        },
        {
          role: "user",
          content: `Gere uma descrição atrativa para este loteamento:\n\n${montarContextoLoteamento(loteamento)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const texto = resposta.choices[0]?.message?.content?.trim()
    if (!texto) return { erro: "A IA não retornou texto" }

    await registrarUsoConversaIA(loteamento.organizacao_id)
    return { sucesso: "Descrição gerada com sucesso", texto }
  } catch {
    return { erro: "Erro ao gerar descrição. Verifique sua chave da OpenAI." }
  }
}

// ============================================================
// Melhorar texto existente
// ============================================================

export async function melhorarTextoLoteamentoIA(
  texto: string,
  loteamentoId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const loteamento = await buscarDadosLoteamento(loteamentoId)
  if (!loteamento) return { erro: "Loteamento não encontrado" }

  const limite = await verificarLimiteConversasIA(loteamento.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um editor especializado em empreendimentos imobiliários. " +
            "Melhore o texto mantendo as informações originais. " +
            "Torne-o mais atrativo, profissional e persuasivo. " +
            "Use português brasileiro. Não adicione informações que não estavam no original.",
        },
        {
          role: "user",
          content: `Melhore esta descrição de loteamento:\n\n${texto}\n\nContexto do loteamento:\n${montarContextoLoteamento(loteamento)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const textoMelhorado = resposta.choices[0]?.message?.content?.trim()
    if (!textoMelhorado) return { erro: "A IA não retornou texto" }

    await registrarUsoConversaIA(loteamento.organizacao_id)
    return { sucesso: "Texto melhorado com sucesso", texto: textoMelhorado }
  } catch {
    return { erro: "Erro ao melhorar texto. Verifique sua chave da OpenAI." }
  }
}

// ============================================================
// Salvar descrição IA no loteamento
// ============================================================

export async function salvarDescricaoLoteamentoIA(
  loteamentoId: string,
  texto: string
): Promise<EstadoFormulario> {
  const supabase = await criarClienteServer()

  const { error } = await supabase
    .from("loteamentos")
    .update({ descricao_ia: texto })
    .eq("id", loteamentoId)

  if (error) return { erro: "Erro ao salvar texto" }

  revalidatePath(`/loteamentos/${loteamentoId}`)
  return { sucesso: "Descrição salva com sucesso" }
}
