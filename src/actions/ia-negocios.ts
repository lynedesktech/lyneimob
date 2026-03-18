"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { getOpenAI } from "@/lib/openai"
import { verificarLimiteConversasIA, registrarUsoConversaIA } from "@/lib/verificar-limites"
import type { EstadoFormulario } from "@/types/formulario"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Análise de contexto do negócio
// ============================================================

export async function analisarNegocio(
  negocioId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const limite = await verificarLimiteConversasIA(usuario.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

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
    const resposta = await getOpenAI().chat.completions.create({
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

    await registrarUsoConversaIA(usuario.organizacao_id)
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

  const limite = await verificarLimiteConversasIA(usuario.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  const supabase = await criarClienteServer()

  const { data: negocio, error } = await supabase
    .from("negocios")
    .select(
      "*, clientes(nome, tipo, telefone, whatsapp), pipeline_etapas(nome, ordem)"
    )
    .eq("id", negocioId)
    .single()

  if (error || !negocio) return { erro: "Negócio não encontrado" }

  // Buscar interações recentes do cliente
  const { data: interacoes } = await supabase
    .from("cliente_interacoes")
    .select("tipo, descricao, data")
    .eq("cliente_id", negocio.cliente_id)
    .order("data", { ascending: false })
    .limit(3)

  // Buscar atividades pendentes do negócio
  const { data: atividadesPendentes } = await supabase
    .from("atividades")
    .select("titulo, tipo, data_inicio, prioridade")
    .eq("negocio_id", negocioId)
    .eq("status", "pendente")
    .order("data_inicio", { ascending: true })
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

ATIVIDADES PENDENTES:
${
  atividadesPendentes && atividadesPendentes.length > 0
    ? atividadesPendentes
        .map(
          (a) =>
            `- [${a.tipo}] ${a.titulo} — ${new Date(a.data_inicio).toLocaleDateString("pt-BR")} (${a.prioridade})`
        )
        .join("\n")
    : "Nenhuma atividade pendente"
}

Responda EXCLUSIVAMENTE com um JSON válido (sem markdown, sem backticks) no formato:
{
  "acao_resumida": "Frase curta do que fazer agora (máx 60 caracteres)",
  "tipo_atividade": "ligacao|email|visita|reuniao|follow_up|proposta",
  "prazo_dias": 2,
  "detalhes": "Passo a passo:\n1. Primeiro passo\n2. Segundo passo\n3. Terceiro passo",
  "script": "Texto pronto para usar em ligação ou mensagem (ou null se não aplicável)"
}

Regras:
- acao_resumida deve ser curta e direta (ex: "Ligar para agendar visita ao imóvel")
- tipo_atividade deve ser um dos tipos listados
- prazo_dias é o número de dias até executar (1 = hoje, 2 = amanhã)
- detalhes deve ter 2-3 passos práticos
- script pode ser null se a ação não envolver comunicação direta`

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    })

    const texto = resposta.choices[0].message.content || ""

    // Tentar extrair o resumo do JSON
    let resumo: string | null = null
    try {
      const json = JSON.parse(texto)
      resumo = json.acao_resumida || null
    } catch {
      // Se não for JSON válido, usar a primeira linha como resumo
      resumo = texto.split("\n")[0].slice(0, 80)
    }

    await supabase
      .from("negocios")
      .update({ sugestao_ia: texto, sugestao_ia_resumo: resumo })
      .eq("id", negocioId)

    await registrarUsoConversaIA(usuario.organizacao_id)
    revalidatePath(`/negocios/${negocioId}`)
    revalidatePath("/negocios")
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

  const limite = await verificarLimiteConversasIA(usuario.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

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
    const resposta = await getOpenAI().chat.completions.create({
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

    await registrarUsoConversaIA(usuario.organizacao_id)
    revalidatePath(`/negocios/${negocioId}`)
    return { sucesso: "Análise de perda gerada", texto }
  } catch {
    return { erro: "Erro ao gerar análise. Verifique a chave da OpenAI." }
  }
}
