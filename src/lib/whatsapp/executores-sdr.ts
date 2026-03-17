import { obterProximoCorretor } from "@/lib/distribuicao-leads"

// ============================================================
// Executores dos tools do agente SDR
// Cada função interage com o banco via admin client
// ============================================================

export type ContextoTool = {
  conversaId: string
  organizacaoId: string
  numeroCliente: string
  clienteId: string | null
  negocioId: string | null
}

/**
 * Busca o corretor via distribuição, com fallback para corretor padrão do WhatsApp ou admin
 */
export async function obterCorretorParaAtribuicao(organizacaoId: string): Promise<string | null> {
  // Tentar obter via distribuição centralizada
  const corretorDistribuicao = await obterProximoCorretor(organizacaoId)
  if (corretorDistribuicao) return corretorDistribuicao

  // Fallback: corretor padrão da config WhatsApp
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  const { data: config } = await supabase
    .from("config_whatsapp")
    .select("corretor_padrao_id")
    .eq("organizacao_id", organizacaoId)
    .single()

  if (config?.corretor_padrao_id) return config.corretor_padrao_id

  // Fallback final: admin da org
  const { data: admin } = await supabase
    .from("usuarios")
    .select("id")
    .eq("organizacao_id", organizacaoId)
    .eq("cargo", "admin")
    .limit(1)
    .single()

  return admin?.id || null
}

// ============================================================
// Implementação de cada executor
// ============================================================

export async function executarBuscarImoveis(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  let query = supabase
    .from("imoveis")
    .select("id, titulo, tipo, finalidade, bairro, cidade, estado, preco_venda, preco_aluguel, quartos, area_total")
    .eq("organizacao_id", contexto.organizacaoId)
    .eq("status", "disponivel")

  if (args.tipo) query = query.eq("tipo", args.tipo as string)
  if (args.finalidade) {
    const fin = args.finalidade as string
    query = query.or(`finalidade.eq.${fin},finalidade.eq.venda_e_aluguel`)
  }
  if (args.cidade) query = query.ilike("cidade", `%${args.cidade}%`)
  if (args.bairro) query = query.ilike("bairro", `%${args.bairro}%`)
  if (args.preco_min) {
    const min = args.preco_min as number
    query = query.or(`preco_venda.gte.${min},preco_aluguel.gte.${min}`)
  }
  if (args.preco_max) {
    const max = args.preco_max as number
    query = query.or(`preco_venda.lte.${max},preco_aluguel.lte.${max}`)
  }
  if (args.quartos_min) query = query.gte("quartos", args.quartos_min as number)

  const { data: imoveis, error } = await query
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) return `Erro ao buscar imóveis: ${error.message}`
  if (!imoveis || imoveis.length === 0) return "Nenhum imóvel encontrado com esses critérios."

  const lista = imoveis.map((i) => {
    const preco = i.preco_venda
      ? `Venda: R$ ${Number(i.preco_venda).toLocaleString("pt-BR")}`
      : i.preco_aluguel
        ? `Aluguel: R$ ${Number(i.preco_aluguel).toLocaleString("pt-BR")}/mês`
        : "Preço sob consulta"
    return `- [${i.id}] ${i.titulo} | ${i.tipo} | ${i.bairro || ""}, ${i.cidade}-${i.estado} | ${preco} | ${i.quartos || 0} quartos | ${i.area_total || "?"}m²`
  })

  return `Encontrei ${imoveis.length} imóvel(is):\n${lista.join("\n")}`
}

export async function executarCriarCliente(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Se já existe um cliente pré-criado → atualizar em vez de inserir
  if (contexto.clienteId) {
    const { error } = await supabase
      .from("clientes")
      .update({
        nome: args.nome as string,
        ...(args.email ? { email: args.email as string } : {}),
        ...(args.tipo ? { tipo: args.tipo as string } : {}),
        ...(args.observacoes ? { observacoes: args.observacoes as string } : {}),
      })
      .eq("id", contexto.clienteId)

    if (error) return `Erro ao atualizar cliente: ${error.message}`
    return `Cliente atualizado com sucesso. ID: ${contexto.clienteId}`
  }

  // Caso raro onde não houve pré-criação → inserir normalmente
  const corretorId = await obterCorretorParaAtribuicao(contexto.organizacaoId)
  if (!corretorId) return "Erro: nenhum corretor encontrado na organização."

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      organizacao_id: contexto.organizacaoId,
      corretor_id: corretorId,
      nome: args.nome as string,
      telefone: contexto.numeroCliente,
      whatsapp: contexto.numeroCliente,
      email: (args.email as string) || null,
      tipo: (args.tipo as string) || "comprador",
      origem: "whatsapp",
      observacoes: (args.observacoes as string) || null,
    })
    .select("id")
    .single()

  if (error) return `Erro ao criar cliente: ${error.message}`

  // Vincular cliente à conversa
  await supabase
    .from("conversas_whatsapp")
    .update({ cliente_id: cliente.id })
    .eq("id", contexto.conversaId)

  return `Cliente criado com sucesso. ID: ${cliente.id}`
}

export async function executarCriarNegocio(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Se já existe um negócio pré-criado → atualizar em vez de inserir
  if (contexto.negocioId) {
    const { error } = await supabase
      .from("negocios")
      .update({
        ...(args.titulo ? { titulo: args.titulo as string } : {}),
        ...(args.tipo ? { tipo: args.tipo as string } : {}),
        ...(args.valor ? { valor: args.valor as number } : {}),
        ...(args.imovel_id ? { imovel_id: args.imovel_id as string } : {}),
      })
      .eq("id", contexto.negocioId)

    if (error) return `Erro ao atualizar negócio: ${error.message}`
    return `Negócio atualizado com sucesso. ID: ${contexto.negocioId}`
  }

  // Caso raro onde não houve pré-criação → inserir normalmente
  // Buscar primeira etapa normal do pipeline
  const { data: etapa } = await supabase
    .from("pipeline_etapas")
    .select("id")
    .eq("organizacao_id", contexto.organizacaoId)
    .eq("tipo", "normal")
    .order("ordem", { ascending: true })
    .limit(1)
    .single()

  if (!etapa) return "Erro: nenhuma etapa de pipeline encontrada."

  // Obter corretor via distribuição com fallback
  const corretorId = await obterCorretorParaAtribuicao(contexto.organizacaoId)
  if (!corretorId) return "Erro: nenhum corretor encontrado na organização."

  // Calcular próxima posição na etapa
  const { data: ultimoNegocio } = await supabase
    .from("negocios")
    .select("posicao")
    .eq("etapa_id", etapa.id)
    .order("posicao", { ascending: false })
    .limit(1)
    .single()

  const posicao = (ultimoNegocio?.posicao ?? -1) + 1

  const { data: negocio, error } = await supabase
    .from("negocios")
    .insert({
      organizacao_id: contexto.organizacaoId,
      corretor_id: corretorId,
      cliente_id: args.cliente_id as string,
      imovel_id: (args.imovel_id as string) || null,
      etapa_id: etapa.id,
      titulo: args.titulo as string,
      tipo: (args.tipo as string) || "venda",
      valor: (args.valor as number) || null,
      posicao,
    })
    .select("id")
    .single()

  if (error) return `Erro ao criar negócio: ${error.message}`

  // Vincular negócio à conversa
  await supabase
    .from("conversas_whatsapp")
    .update({ negocio_id: negocio.id })
    .eq("id", contexto.conversaId)

  return `Negócio criado com sucesso. ID: ${negocio.id}`
}

export async function executarCriarAtividade(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Obter corretor via distribuição com fallback
  const usuarioId = await obterCorretorParaAtribuicao(contexto.organizacaoId)
  if (!usuarioId) return "Erro: nenhum usuário encontrado na organização."

  const { error } = await supabase
    .from("atividades")
    .insert({
      organizacao_id: contexto.organizacaoId,
      usuario_id: usuarioId,
      titulo: args.titulo as string,
      tipo: (args.tipo as string) || "follow_up",
      data_inicio: args.data_inicio as string,
      cliente_id: (args.cliente_id as string) || null,
      negocio_id: (args.negocio_id as string) || null,
      descricao: (args.descricao as string) || null,
    })

  if (error) return `Erro ao criar atividade: ${error.message}`

  return "Atividade agendada com sucesso."
}

export async function executarSalvarQualificacao(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Buscar qualificação existente para merge
  const { data: conversa } = await supabase
    .from("conversas_whatsapp")
    .select("qualificacao")
    .eq("id", contexto.conversaId)
    .single()

  const qualificacaoExistente = (conversa?.qualificacao as Record<string, unknown>) || {}

  const novaQualificacao = {
    ...qualificacaoExistente,
    ...(args.tipo_imovel !== undefined && { tipo_imovel: args.tipo_imovel }),
    ...(args.finalidade !== undefined && { finalidade: args.finalidade }),
    ...(args.bairros !== undefined && { bairros: args.bairros }),
    ...(args.faixa_preco !== undefined && { faixa_preco: args.faixa_preco }),
    ...(args.urgencia !== undefined && { urgencia: args.urgencia }),
    ...(args.observacoes !== undefined && { observacoes: args.observacoes }),
  }

  const { error } = await supabase
    .from("conversas_whatsapp")
    .update({ qualificacao: novaQualificacao })
    .eq("id", contexto.conversaId)

  if (error) return `Erro ao salvar qualificação: ${error.message}`

  return "Qualificação salva com sucesso."
}

export async function executarEncaminharCorretor(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Obter corretor via distribuição com fallback
  const corretorId = await obterCorretorParaAtribuicao(contexto.organizacaoId)

  const { error } = await supabase
    .from("conversas_whatsapp")
    .update({
      status: "encaminhado",
      resumo_ia: args.resumo as string,
      corretor_id: corretorId || null,
    })
    .eq("id", contexto.conversaId)

  if (error) return `Erro ao encaminhar: ${error.message}`

  return `Conversa encaminhada para o corretor. Motivo: ${args.motivo}`
}
