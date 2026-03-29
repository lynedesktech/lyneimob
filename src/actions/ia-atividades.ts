"use server"

import { revalidatePath } from "next/cache"
import { criarClienteServer } from "@/lib/supabase/server"
import { getOpenAI } from "@/lib/openai"
import { verificarLimiteConversasIA, registrarUsoConversaIA } from "@/lib/verificar-limites"
import type { EstadoFormulario } from "@/types/formulario"
import { labelsTipoAtividade } from "@/lib/constantes"
import { buscarUsuarioLogado } from "@/lib/buscar-usuario-logado"

// ============================================================
// Gerar briefing antes da atividade
// ============================================================

export async function gerarBriefingVisita(
  atividadeId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const limite = await verificarLimiteConversasIA(usuario.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  const supabase = await criarClienteServer()

  // Buscar atividade com relações
  const { data: atividade, error } = await supabase
    .from("atividades")
    .select(
      "*, clientes(nome, tipo, origem, telefone, whatsapp, observacoes, score_lead), imoveis(titulo, tipo, finalidade, valor, valor_aluguel, bairro, cidade, quartos, area_total), negocios(titulo, tipo, valor, status)"
    )
    .eq("id", atividadeId)
    .single()

  if (error || !atividade) return { erro: "Atividade não encontrada" }

  // Buscar etapa do negócio (se houver)
  let etapaNome = "N/A"
  if (atividade.negocio_id) {
    const { data: negocio } = await supabase
      .from("negocios")
      .select("etapa_id, pipeline_etapas(nome)")
      .eq("id", atividade.negocio_id)
      .single()
    if (negocio) {
      etapaNome = ((negocio as unknown as Record<string, unknown>).pipeline_etapas as Record<string, unknown>)?.nome as string || "N/A"
    }
  }

  // Buscar interações recentes do cliente (se houver)
  let interacoesTexto = "Nenhuma interação registrada"
  if (atividade.cliente_id) {
    const { data: interacoes } = await supabase
      .from("cliente_interacoes")
      .select("tipo, descricao, data")
      .eq("cliente_id", atividade.cliente_id)
      .order("data", { ascending: false })
      .limit(5)

    if (interacoes && interacoes.length > 0) {
      interacoesTexto = interacoes
        .map(
          (i) =>
            `- [${i.tipo}] ${i.descricao} (${new Date(i.data).toLocaleDateString("pt-BR")})`
        )
        .join("\n")
    }
  }

  const prompt = `Você é um consultor imobiliário experiente. Prepare um briefing completo para o corretor antes desta atividade.

ATIVIDADE:
- Tipo: ${labelsTipoAtividade[atividade.tipo] || atividade.tipo}
- Título: ${atividade.titulo}
- Data: ${new Date(atividade.data_vencimento).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
- Descrição: ${atividade.descricao || "Sem descrição"}

CLIENTE:
${
  atividade.clientes
    ? `- Nome: ${(atividade.clientes as Record<string, unknown>)?.nome}
- Tipo: ${(atividade.clientes as Record<string, unknown>)?.tipo || "N/A"}
- Origem: ${(atividade.clientes as Record<string, unknown>)?.origem || "N/A"}
- Score: ${(atividade.clientes as Record<string, unknown>)?.score_lead || 0}/100
- Observações: ${(atividade.clientes as Record<string, unknown>)?.observacoes || "Nenhuma"}`
    : "Nenhum cliente vinculado"
}

IMÓVEL:
${
  atividade.imoveis
    ? `- ${(atividade.imoveis as Record<string, unknown>)?.titulo}
- Tipo: ${(atividade.imoveis as Record<string, unknown>)?.tipo} | ${(atividade.imoveis as Record<string, unknown>)?.finalidade}
- Valor venda: ${(atividade.imoveis as Record<string, unknown>)?.valor ? `R$ ${Number((atividade.imoveis as Record<string, unknown>)?.valor).toLocaleString("pt-BR")}` : "N/A"}
- Valor aluguel: ${(atividade.imoveis as Record<string, unknown>)?.valor_aluguel ? `R$ ${Number((atividade.imoveis as Record<string, unknown>)?.valor_aluguel).toLocaleString("pt-BR")}` : "N/A"}
- Local: ${(atividade.imoveis as Record<string, unknown>)?.bairro || ""}, ${(atividade.imoveis as Record<string, unknown>)?.cidade || ""}
- ${(atividade.imoveis as Record<string, unknown>)?.quartos || 0} quartos, ${(atividade.imoveis as Record<string, unknown>)?.area_total || "N/A"}m²`
    : "Nenhum imóvel vinculado"
}

NEGÓCIO:
${
  atividade.negocios
    ? `- ${(atividade.negocios as Record<string, unknown>)?.titulo} (${(atividade.negocios as Record<string, unknown>)?.tipo})
- Valor: ${(atividade.negocios as Record<string, unknown>)?.valor ? `R$ ${Number((atividade.negocios as Record<string, unknown>)?.valor).toLocaleString("pt-BR")}` : "N/A"}
- Etapa: ${etapaNome}`
    : "Nenhum negócio vinculado"
}

ÚLTIMAS INTERAÇÕES COM O CLIENTE:
${interacoesTexto}

Responda em português brasileiro, de forma prática e direta:
1. PREPARAÇÃO: checklist do que levar/preparar para esta ${labelsTipoAtividade[atividade.tipo] || "atividade"}
2. PONTOS-CHAVE: destaques do imóvel ou da negociação que o corretor deve explorar
3. CONTEXTO DO CLIENTE: resumo do perfil e histórico para personalizar o atendimento
4. PERGUNTAS SUGERIDAS: 3-4 perguntas que o corretor deve fazer ao cliente
5. OBJEÇÕES PROVÁVEIS: possíveis objeções e como contorná-las`

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    })

    const texto = resposta.choices[0].message.content || ""

    // Salvar no banco
    await supabase
      .from("atividades")
      .update({ briefing_ia: texto })
      .eq("id", atividadeId)

    await registrarUsoConversaIA(usuario.organizacao_id)
    revalidatePath(`/atividades/${atividadeId}`)
    return { sucesso: "Briefing gerado com sucesso", texto }
  } catch {
    return { erro: "Erro ao gerar briefing. Verifique a chave da OpenAI." }
  }
}

// ============================================================
// Sugestão pós-atividade concluída
// ============================================================

export async function gerarSugestaoPosAtividade(
  atividadeId: string
): Promise<EstadoFormulario & { texto?: string }> {
  const usuario = await buscarUsuarioLogado()
  if (!usuario) return { erro: "Usuário não autenticado" }

  const limite = await verificarLimiteConversasIA(usuario.organizacao_id)
  if (!limite.permitido) return { erro: limite.mensagem! }

  const supabase = await criarClienteServer()

  const { data: atividade, error } = await supabase
    .from("atividades")
    .select(
      "*, clientes(nome, tipo), negocios(titulo, tipo, valor, status)"
    )
    .eq("id", atividadeId)
    .single()

  if (error || !atividade) return { erro: "Atividade não encontrada" }

  if (atividade.status !== "concluida") {
    return { erro: "Esta sugestão só está disponível para atividades concluídas" }
  }

  // Buscar etapa do negócio (se houver)
  let etapaNome = "N/A"
  if (atividade.negocio_id) {
    const { data: negocio } = await supabase
      .from("negocios")
      .select("etapa_id, pipeline_etapas(nome)")
      .eq("id", atividade.negocio_id)
      .single()
    if (negocio) {
      etapaNome = ((negocio as unknown as Record<string, unknown>).pipeline_etapas as Record<string, unknown>)?.nome as string || "N/A"
    }
  }

  const prompt = `Você é um coach de vendas imobiliárias. Analise esta atividade concluída e sugira o próximo passo.

ATIVIDADE CONCLUÍDA:
- Tipo: ${labelsTipoAtividade[atividade.tipo] || atividade.tipo}
- Título: ${atividade.titulo}
- Data: ${new Date(atividade.data_vencimento).toLocaleDateString("pt-BR")}
- Concluída em: ${atividade.data_conclusao ? new Date(atividade.data_conclusao).toLocaleDateString("pt-BR") : "N/A"}
- Notas do corretor: ${atividade.notas_pos_atividade || "Nenhuma nota registrada"}

CLIENTE: ${atividade.clientes ? `${(atividade.clientes as Record<string, unknown>)?.nome} (${(atividade.clientes as Record<string, unknown>)?.tipo})` : "Sem cliente vinculado"}

NEGÓCIO: ${
  atividade.negocios
    ? `${(atividade.negocios as Record<string, unknown>)?.titulo} (${(atividade.negocios as Record<string, unknown>)?.tipo}) - Valor: ${(atividade.negocios as Record<string, unknown>)?.valor ? `R$ ${Number((atividade.negocios as Record<string, unknown>)?.valor).toLocaleString("pt-BR")}` : "N/A"} - Etapa: ${etapaNome}`
    : "Sem negócio vinculado"
}

Responda em português brasileiro de forma direta e prática:
1. ANÁLISE: o que a conclusão desta atividade indica sobre o andamento (2-3 frases)
2. PRÓXIMA AÇÃO: o que o corretor deve fazer agora (1 frase clara)
3. PRAZO: em quantos dias essa próxima ação deve acontecer
4. TIPO SUGERIDO: qual tipo de atividade criar (ligação, visita, follow-up, proposta, etc.)
5. DICA: uma dica prática para maximizar o resultado`

  try {
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    })

    const texto = resposta.choices[0].message.content || ""

    await supabase
      .from("atividades")
      .update({ sugestao_ia: texto })
      .eq("id", atividadeId)

    await registrarUsoConversaIA(usuario.organizacao_id)
    revalidatePath(`/atividades/${atividadeId}`)
    return { sucesso: "Sugestão gerada com sucesso", texto }
  } catch {
    return { erro: "Erro ao gerar sugestão. Verifique a chave da OpenAI." }
  }
}
