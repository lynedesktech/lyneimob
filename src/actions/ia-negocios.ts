"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { openai } from "@/lib/openai"
import type { EstadoFormulario } from "@/types/formulario"

// ============================================================
// Helpers
// ============================================================

async function buscarUsuarioLogado() {
  const supabase = await criarClienteServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  return usuario
}

// ============================================================
// Análise de contexto do negócio
// ============================================================

export async function analisarNegocio(
  negocioId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const supabase = await criarClienteServer()

  // Buscar negócio com relações
  const { data: negocio, error } = await supabase
    .from("negocios")
    .select(
      "*, clientes(nome, tipo, origem, score_lead, observacoes), imoveis(titulo, tipo, finalidade, preco_venda, preco_aluguel, bairro, cidade, quartos, area_total)"
    )
    .eq("id", negocioId)
    .single()

  if (error || !negocio) return { erro: "Negócio não encontrado" }

  // Buscar etapa atual
  const { data: etapa } = await supabase
    .from("pipeline_etapas")
    .select("nome, ordem")
    .eq("id", negocio.etapa_id)
    .single()

  // Buscar interações recentes do cliente
  const { data: interacoes } = await supabase
    .from("cliente_interacoes")
    .select("tipo, descricao, data")
    .eq("cliente_id", negocio.cliente_id)
    .order("data", { ascending: false })
    .limit(5)

  const prompt = `Você é um consultor imobiliário experiente. Analise o contexto deste negócio e forneça uma análise estratégica.

NEGÓCIO:
- Título: ${negocio.titulo}
- Tipo: ${negocio.tipo}
- Valor: ${negocio.valor ? `R$ ${negocio.valor.toLocaleString("pt-BR")}` : "Não definido"}
- Etapa atual: ${etapa?.nome || "N/A"}
- Previsão: ${negocio.previsao_fechamento || "Sem previsão"}
- Observações: ${negocio.observacoes || "Nenhuma"}

CLIENTE:
- Nome: ${(negocio.clientes as Record<string, unknown>)?.nome || "N/A"}
- Tipo: ${(negocio.clientes as Record<string, unknown>)?.tipo || "N/A"}
- Origem: ${(negocio.clientes as Record<string, unknown>)?.origem || "N/A"}
- Score: ${(negocio.clientes as Record<string, unknown>)?.score_lead || 0}/100

IMÓVEL:
${
  negocio.imoveis
    ? `- ${(negocio.imoveis as Record<string, unknown>)?.titulo}
- Tipo: ${(negocio.imoveis as Record<string, unknown>)?.tipo} | ${(negocio.imoveis as Record<string, unknown>)?.finalidade}
- Valor venda: ${(negocio.imoveis as Record<string, unknown>)?.preco_venda || "N/A"}
- Valor aluguel: ${(negocio.imoveis as Record<string, unknown>)?.preco_aluguel || "N/A"}
- Local: ${(negocio.imoveis as Record<string, unknown>)?.bairro || ""}, ${(negocio.imoveis as Record<string, unknown>)?.cidade || ""}
- ${(negocio.imoveis as Record<string, unknown>)?.quartos || 0} quartos, ${(negocio.imoveis as Record<string, unknown>)?.area_total || "N/A"}m²`
    : "Nenhum imóvel vinculado"
}

ÚLTIMAS INTERAÇÕES:
${
  interacoes && interacoes.length > 0
    ? interacoes
        .map(
          (i) =>
            `- [${i.tipo}] ${i.descricao} (${new Date(i.data).toLocaleDateString("pt-BR")})`
        )
        .join("\n")
    : "Nenhuma interação registrada"
}

Responda em português brasileiro, em 3-4 parágrafos curtos:
1. Avaliação geral do negócio (pontos fortes e fracos)
2. Riscos identificados
3. Probabilidade estimada de fechamento (alta/média/baixa) com justificativa`

  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })

    const texto = resposta.choices[0].message.content || ""

    // Salvar no banco
    await supabase
      .from("negocios")
      .update({ analise_ia: texto })
      .eq("id", negocioId)

    revalidatePath(`/negocios/${negocioId}`)
    return { sucesso: "Análise gerada com sucesso", texto }
  } catch {
    return { erro: "Erro ao gerar análise. Verifique a chave da OpenAI." }
  }
}

// ============================================================
// Sugestão de próxima ação
// ============================================================

export async function sugerirAcao(
  negocioId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const supabase = await criarClienteServer()

  const { data: negocio, error } = await supabase
    .from("negocios")
    .select(
      "*, clientes(nome, tipo, telefone, whatsapp), pipeline_etapas(nome, ordem)"
    )
    .eq("id", negocioId)
    .single()

  if (error || !negocio) return { erro: "Negócio não encontrado" }

  // Buscar interações recentes
  const { data: interacoes } = await supabase
    .from("cliente_interacoes")
    .select("tipo, descricao, data")
    .eq("cliente_id", negocio.cliente_id)
    .order("data", { ascending: false })
    .limit(3)

  const etapaNome = (negocio.pipeline_etapas as Record<string, unknown>)?.nome || "N/A"

  const prompt = `Você é um coach de vendas imobiliárias. Sugira a PRÓXIMA AÇÃO concreta que o corretor deve tomar neste negócio.

CONTEXTO:
- Negócio: ${negocio.titulo} (${negocio.tipo})
- Valor: ${negocio.valor ? `R$ ${negocio.valor.toLocaleString("pt-BR")}` : "Não definido"}
- Etapa atual: ${etapaNome}
- Cliente: ${(negocio.clientes as Record<string, unknown>)?.nome} (${(negocio.clientes as Record<string, unknown>)?.tipo})

ÚLTIMAS INTERAÇÕES:
${
  interacoes && interacoes.length > 0
    ? interacoes
        .map(
          (i) =>
            `- [${i.tipo}] ${i.descricao} (${new Date(i.data).toLocaleDateString("pt-BR")})`
        )
        .join("\n")
    : "Nenhuma interação registrada"
}

Responda em português brasileiro de forma direta e prática:
1. AÇÃO: o que o corretor deve fazer agora (1 frase)
2. COMO: passo a passo simples (2-3 bullets)
3. SCRIPT: se for ligação ou mensagem, sugira um texto pronto para usar`

  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    })

    const texto = resposta.choices[0].message.content || ""

    await supabase
      .from("negocios")
      .update({ sugestao_ia: texto })
      .eq("id", negocioId)

    revalidatePath(`/negocios/${negocioId}`)
    return { sucesso: "Sugestão gerada com sucesso", texto }
  } catch {
    return { erro: "Erro ao gerar sugestão. Verifique a chave da OpenAI." }
  }
}

// ============================================================
// Análise de perda (para negócios perdidos)
// ============================================================

export async function analisarPerda(
  negocioId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const supabase = await criarClienteServer()

  const { data: negocio, error } = await supabase
    .from("negocios")
    .select("*, clientes(nome, tipo, origem), imoveis(titulo, tipo, preco_venda, preco_aluguel)")
    .eq("id", negocioId)
    .single()

  if (error || !negocio) return { erro: "Negócio não encontrado" }

  if (negocio.status !== "perdido") {
    return { erro: "Esta análise só está disponível para negócios perdidos" }
  }

  const prompt = `Você é um analista de vendas imobiliárias. Analise esta perda e extraia aprendizados.

NEGÓCIO PERDIDO:
- Título: ${negocio.titulo}
- Tipo: ${negocio.tipo}
- Valor: ${negocio.valor ? `R$ ${negocio.valor.toLocaleString("pt-BR")}` : "N/A"}
- Motivo informado: ${negocio.motivo_perda || "Não informado"}
- Tempo até perda: ${
    negocio.data_perda && negocio.created_at
      ? `${Math.floor((new Date(negocio.data_perda).getTime() - new Date(negocio.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias`
      : "N/A"
  }

CLIENTE: ${(negocio.clientes as Record<string, unknown>)?.nome} (${(negocio.clientes as Record<string, unknown>)?.tipo}, origem: ${(negocio.clientes as Record<string, unknown>)?.origem})

IMÓVEL: ${negocio.imoveis ? (negocio.imoveis as Record<string, unknown>)?.titulo : "N/A"}

Responda em português brasileiro:
1. DIAGNÓSTICO: o que provavelmente causou a perda (2-3 frases)
2. PADRÃO: se isso indica um padrão que o corretor deve observar
3. PREVENÇÃO: como evitar perdas similares no futuro (2-3 ações concretas)
4. RECUPERAÇÃO: se vale tentar reabrir este negócio e como`

  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })

    const texto = resposta.choices[0].message.content || ""

    await supabase
      .from("negocios")
      .update({ analise_ia: texto })
      .eq("id", negocioId)

    revalidatePath(`/negocios/${negocioId}`)
    return { sucesso: "Análise de perda gerada", texto }
  } catch {
    return { erro: "Erro ao gerar análise. Verifique a chave da OpenAI." }
  }
}
