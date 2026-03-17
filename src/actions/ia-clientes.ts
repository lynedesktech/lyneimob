"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { getOpenAI } from "@/lib/openai"
import { verificarLimiteConversasIA, registrarUsoConversaIA } from "@/lib/verificar-limites"
import type { EstadoFormulario } from "@/types/formulario"
import { labelsTipoCliente as labelsTipo, labelsOrigem, labelsTipoImovel, labelsTipoInteracao } from "@/lib/constantes"

// ============================================================
// Helpers
// ============================================================

async function buscarClienteCompleto(clienteId: string) {
  const supabase = await criarClienteServer()
  const { data } = await supabase
    .from("clientes")
    .select("*, cliente_interesses(*), cliente_interacoes(*, usuarios(nome))")
    .eq("id", clienteId)
    .single()
  return data
}

function montarContextoCliente(cliente: Record<string, unknown>): string {
  const partes: string[] = []

  partes.push(`Nome: ${cliente.nome}`)
  partes.push(`Tipo: ${labelsTipo[cliente.tipo as string] ?? cliente.tipo}`)
  partes.push(`Origem: ${labelsOrigem[cliente.origem as string] ?? cliente.origem}`)
  partes.push(`Status: ${cliente.status}`)

  if (cliente.email) partes.push(`Email: ${cliente.email}`)
  if (cliente.telefone) partes.push(`Telefone: ${cliente.telefone}`)
  if (cliente.whatsapp) partes.push(`WhatsApp: ${cliente.whatsapp}`)
  if (cliente.observacoes) partes.push(`Observações: ${cliente.observacoes}`)

  // Interesses
  const interesses = cliente.cliente_interesses as Array<Record<string, unknown>> | undefined
  if (interesses && interesses.length > 0) {
    partes.push("\nInteresses:")
    interesses.forEach((interesse, i) => {
      const detalhes: string[] = []
      if (interesse.tipo_imovel) detalhes.push(`Tipo: ${labelsTipoImovel[interesse.tipo_imovel as string] ?? interesse.tipo_imovel}`)
      if (interesse.finalidade) detalhes.push(`Finalidade: ${interesse.finalidade}`)
      if (interesse.cidade) detalhes.push(`Cidade: ${interesse.cidade} - ${interesse.estado || ""}`)
      if (interesse.bairros_interesse) {
        const bairros = interesse.bairros_interesse as string[]
        if (bairros.length > 0) detalhes.push(`Bairros: ${bairros.join(", ")}`)
      }
      if (interesse.preco_min || interesse.preco_max) {
        const min = interesse.preco_min ? `R$ ${Number(interesse.preco_min).toLocaleString("pt-BR")}` : "sem mínimo"
        const max = interesse.preco_max ? `R$ ${Number(interesse.preco_max).toLocaleString("pt-BR")}` : "sem máximo"
        detalhes.push(`Faixa de preço: ${min} a ${max}`)
      }
      if (interesse.quartos_min) detalhes.push(`Quartos mín: ${interesse.quartos_min}`)
      if (interesse.area_min) detalhes.push(`Área mín: ${interesse.area_min}m²`)
      if (interesse.observacoes) detalhes.push(`Obs: ${interesse.observacoes}`)
      partes.push(`  Interesse ${i + 1}: ${detalhes.join(" | ")}`)
    })
  }

  // Interações recentes (últimas 10)
  const interacoes = cliente.cliente_interacoes as Array<Record<string, unknown>> | undefined
  if (interacoes && interacoes.length > 0) {
    partes.push("\nInterações recentes:")
    const recentes = interacoes.slice(0, 10)
    recentes.forEach((interacao) => {
      const usuario = interacao.usuarios as Record<string, unknown> | undefined
      const nomeUsuario = usuario?.nome || "Desconhecido"
      const data = new Date(interacao.data as string).toLocaleDateString("pt-BR")
      partes.push(`  - [${data}] ${labelsTipoInteracao[interacao.tipo as string] ?? interacao.tipo} por ${nomeUsuario}: ${interacao.descricao}`)
    })
  }

  return partes.join("\n")
}

// ============================================================
// Gerar score de lead
// ============================================================

export async function gerarScoreLead(
  clienteId: string
): Promise<EstadoFormulario & { score?: number }> {
  const cliente = await buscarClienteCompleto(clienteId)
  if (!cliente) return { erro: "Cliente não encontrado" }

  const limite = await verificarLimiteConversasIA(cliente.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  // Cálculo determinístico (até 60 pontos)
  let scoreDeterministico = 0

  if (cliente.email) scoreDeterministico += 5
  if (cliente.telefone) scoreDeterministico += 5
  if (cliente.whatsapp) scoreDeterministico += 5
  if (cliente.cpf_cnpj) scoreDeterministico += 5

  const interesses = (cliente.cliente_interesses as Array<Record<string, unknown>>) || []
  if (interesses.length > 0) {
    scoreDeterministico += 10
    // Interesse completo (tem tipo + finalidade + preço + bairro)
    const interesseCompleto = interesses.some(
      (i) => i.tipo_imovel && i.finalidade && (i.preco_min || i.preco_max) && i.bairros_interesse
    )
    if (interesseCompleto) scoreDeterministico += 10
  }

  const interacoes = (cliente.cliente_interacoes as Array<Record<string, unknown>>) || []
  // +3 por interação, máximo 15
  scoreDeterministico += Math.min(interacoes.length * 3, 15)

  // Interação nos últimos 7 dias
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
  const temInteracaoRecente = interacoes.some(
    (i) => new Date(i.data as string) >= seteDiasAtras
  )
  if (temInteracaoRecente) scoreDeterministico += 5

  // Ajuste da IA (até 40 pontos)
  let ajusteIA = 0
  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um analista de leads imobiliários. " +
            "Analise este lead e atribua uma pontuação de ajuste de 0 a 40 pontos, " +
            "considerando qualidade do engajamento, urgência e potencial de conversão. " +
            "Retorne APENAS um JSON válido no formato: {\"ajuste\": numero}",
        },
        {
          role: "user",
          content: `Analise este lead:\n\n${montarContextoCliente(cliente)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    })

    const conteudo = resposta.choices[0]?.message?.content?.trim()
    if (conteudo) {
      const parsed = JSON.parse(conteudo)
      ajusteIA = Math.min(Math.max(parsed.ajuste || 0, 0), 40)
    }
  } catch {
    // Se a IA falhar, usar apenas o score determinístico
    ajusteIA = 0
  }

  const scoreTotal = Math.min(scoreDeterministico + ajusteIA, 100)

  // Salvar no banco
  const supabase = await criarClienteServer()
  await supabase
    .from("clientes")
    .update({ score_lead: scoreTotal })
    .eq("id", clienteId)

  await registrarUsoConversaIA(cliente.organizacao_id)
  revalidatePath(`/clientes/${clienteId}`)
  return { sucesso: "Score calculado com sucesso", score: scoreTotal }
}

// ============================================================
// Gerar resumo do perfil
// ============================================================

export async function gerarResumoCliente(
  clienteId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const cliente = await buscarClienteCompleto(clienteId)
  if (!cliente) return { erro: "Cliente não encontrado" }

  const limite = await verificarLimiteConversasIA(cliente.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente de gestão imobiliária. " +
            "Gere um resumo executivo de 2-3 frases sobre este cliente, destacando: " +
            "o que ele busca, nível de engajamento e recomendação de próxima ação para o corretor. " +
            "Use português brasileiro. Seja direto e prático.",
        },
        {
          role: "user",
          content: `Gere um resumo para este cliente:\n\n${montarContextoCliente(cliente)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    })

    const texto = resposta.choices[0]?.message?.content?.trim()
    if (!texto) return { erro: "A IA não retornou texto" }

    // Salvar no banco
    const supabase = await criarClienteServer()
    await supabase
      .from("clientes")
      .update({ resumo_ia: texto })
      .eq("id", clienteId)

    await registrarUsoConversaIA(cliente.organizacao_id)
    revalidatePath(`/clientes/${clienteId}`)
    return { sucesso: "Resumo gerado com sucesso", texto }
  } catch {
    return { erro: "Erro ao gerar resumo. Verifique sua chave da OpenAI." }
  }
}

// ============================================================
// Match inteligente com IA
// ============================================================

export async function matchInteligente(
  clienteId: string
): Promise<EstadoFormulario & { sugestoes?: Array<{ imovel_id: string; score: number; justificativa: string }> }> {
  const cliente = await buscarClienteCompleto(clienteId)
  if (!cliente) return { erro: "Cliente não encontrado" }

  const limite = await verificarLimiteConversasIA(cliente.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  const supabase = await criarClienteServer()

  // Buscar imóveis disponíveis da mesma organização (top 30 mais recentes)
  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("id, titulo, tipo, finalidade, bairro, cidade, estado, preco_venda, preco_aluguel, quartos, area_total")
    .eq("organizacao_id", cliente.organizacao_id)
    .eq("status", "disponivel")
    .order("created_at", { ascending: false })
    .limit(30)

  if (!imoveis || imoveis.length === 0) {
    return { erro: "Nenhum imóvel disponível para comparar" }
  }

  // Montar lista resumida de imóveis
  const listaImoveis = imoveis
    .map((i, idx) => {
      const preco = i.preco_venda
        ? `Venda: R$ ${Number(i.preco_venda).toLocaleString("pt-BR")}`
        : i.preco_aluguel
          ? `Aluguel: R$ ${Number(i.preco_aluguel).toLocaleString("pt-BR")}/mês`
          : "Preço não informado"
      return `${idx + 1}. [${i.id}] ${i.titulo} — ${labelsTipoImovel[i.tipo] ?? i.tipo}, ${i.bairro || ""} ${i.cidade}-${i.estado}, ${preco}, ${i.quartos || 0} quartos, ${i.area_total || "?"}m²`
    })
    .join("\n")

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um corretor de imóveis experiente. " +
            "Analise o perfil do cliente e a lista de imóveis disponíveis. " +
            "Sugira os 5 melhores imóveis para este cliente, mesmo que não batam 100% nos critérios. " +
            "Explique brevemente por que cada um faz sentido. " +
            'Retorne APENAS um JSON válido no formato: [{"imovel_id": "uuid", "score": 0-100, "justificativa": "texto curto"}]',
        },
        {
          role: "user",
          content: `Perfil do cliente:\n${montarContextoCliente(cliente)}\n\nImóveis disponíveis:\n${listaImoveis}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    })

    const conteudo = resposta.choices[0]?.message?.content?.trim()
    if (!conteudo) return { erro: "A IA não retornou sugestões" }

    const sugestoes = JSON.parse(conteudo)
    await registrarUsoConversaIA(cliente.organizacao_id)
    return { sucesso: "Match inteligente concluído", sugestoes }
  } catch {
    return { erro: "Erro ao gerar match inteligente. Verifique sua chave da OpenAI." }
  }
}
