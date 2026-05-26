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

/**
 * Formata um imóvel completo em texto legível para a IA
 */
function formatarImovelCompleto(i: Record<string, unknown>): string {
  const preco = i.valor
    ? `Venda: R$ ${Number(i.valor).toLocaleString("pt-BR")}`
    : i.valor_aluguel
      ? `Aluguel: R$ ${Number(i.valor_aluguel).toLocaleString("pt-BR")}/mês`
      : "Preço sob consulta"
  const partes = [
    `ID: ${i.id}`,
    `Título: ${i.titulo}`,
    `Código interno: ${i.codigo_interno || "sem código"}`,
    `Tipo: ${i.tipo}`,
    `Finalidade: ${i.finalidade}`,
    `Status: ${i.status}`,
    `Endereço: ${[i.logradouro, i.numero, i.bairro, i.cidade, i.estado].filter(Boolean).join(", ")}`,
    `CEP: ${i.cep || "não informado"}`,
    `Preço: ${preco}`,
    i.valor_condominio ? `Condomínio: R$ ${Number(i.valor_condominio).toLocaleString("pt-BR")}/mês` : null,
    i.valor_iptu ? `IPTU: R$ ${Number(i.valor_iptu).toLocaleString("pt-BR")}/ano` : null,
    `Quartos: ${i.quartos || 0}`,
    `Suítes: ${i.suites || 0}`,
    `Banheiros: ${i.banheiros || 0}`,
    `Vagas: ${i.vagas || 0}`,
    `Área total: ${i.area_total ? `${i.area_total}m²` : "não informada"}`,
    `Área construída: ${i.area_construida ? `${i.area_construida}m²` : "não informada"}`,
    i.descricao ? `Descrição: ${i.descricao}` : null,
  ]
  return partes.filter(Boolean).join("\n")
}

const CAMPOS_IMOVEL_COMPLETO = "id, titulo, codigo_interno, tipo, finalidade, status, descricao, logradouro, numero, bairro, cidade, estado, cep, valor, valor_aluguel, valor_condominio, valor_iptu, quartos, suites, banheiros, vagas, area_total, area_construida"

/**
 * Monta URL pública do imóvel no site da imobiliária.
 * Usa dominio customizado quando configurado, senão cai no app principal.
 */
async function montarUrlImovel(organizacaoId: string, imovelId: string): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Tenta domínio customizado verificado
  const { data: dominio } = await supabase
    .from("dominios_customizados")
    .select("dominio, status")
    .eq("organizacao_id", organizacaoId)
    .eq("status", "verificado")
    .single()

  if (dominio?.dominio) {
    return `https://${dominio.dominio}/imoveis/${imovelId}`
  }

  // Fallback: dominio principal + slug
  const { data: org } = await supabase
    .from("organizacoes")
    .select("slug")
    .eq("id", organizacaoId)
    .single()

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://lyneimob.vercel.app"
  return `${base}/${org?.slug || "imobiliaria"}/imoveis/${imovelId}`
}

export async function executarBuscarImovelPorIdentificacao(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  const id = args.id as string | undefined
  const codigo = args.codigo as string | undefined
  const nome = args.nome as string | undefined

  // Busca por ID exato
  if (id) {
    const { data, error } = await supabase
      .from("imoveis")
      .select(CAMPOS_IMOVEL_COMPLETO)
      .eq("organizacao_id", contexto.organizacaoId)
      .eq("id", id)
      .single()

    if (error || !data) return "Imóvel não encontrado com esse ID."
    const url = await montarUrlImovel(contexto.organizacaoId, id)
    return `Imóvel encontrado:\n${formatarImovelCompleto(data as unknown as Record<string, unknown>)}\nLink do site: ${url}\n\nIMPORTANTE: para mandar o card visual (foto + botão) ao cliente, chame a tool enviar_card_imovel com este ID.`
  }

  // Busca por código interno (ex: IMO-001, IMO 01)
  if (codigo) {
    const codigoLimpo = codigo.replace(/\s+/g, "").toUpperCase()
    const { data, error } = await supabase
      .from("imoveis")
      .select(CAMPOS_IMOVEL_COMPLETO)
      .eq("organizacao_id", contexto.organizacaoId)
      .ilike("codigo_interno", `%${codigoLimpo}%`)
      .limit(1)
      .single()

    if (!error && data) {
      const url = await montarUrlImovel(contexto.organizacaoId, (data as Record<string, unknown>).id as string)
      return `Imóvel encontrado:\n${formatarImovelCompleto(data as unknown as Record<string, unknown>)}\nLink do site: ${url}\n\nIMPORTANTE: para mandar o card visual (foto + botão) ao cliente, chame a tool enviar_card_imovel com este ID.`
    }

    // Fallback: tentar busca mais flexível sem hifens
    const codigoSemHifen = codigoLimpo.replace(/-/g, "")
    const { data: data2 } = await supabase
      .from("imoveis")
      .select(CAMPOS_IMOVEL_COMPLETO)
      .eq("organizacao_id", contexto.organizacaoId)

    const imovelMatch = (data2 || []).find((i: Record<string, unknown>) => {
      const cod = String(i.codigo_interno || "").replace(/[-\s]/g, "").toUpperCase()
      return cod === codigoSemHifen || cod.includes(codigoSemHifen)
    })

    if (imovelMatch) {
      const url = await montarUrlImovel(contexto.organizacaoId, (imovelMatch as Record<string, unknown>).id as string)
      return `Imóvel encontrado:\n${formatarImovelCompleto(imovelMatch as unknown as Record<string, unknown>)}\nLink do site: ${url}\n\nIMPORTANTE: para mandar o card visual (foto + botão) ao cliente, chame a tool enviar_card_imovel com este ID.`
    }

    return `Nenhum imóvel encontrado com o código "${codigo}".`
  }

  // Busca por nome/título (busca parcial)
  if (nome) {
    const { data, error } = await supabase
      .from("imoveis")
      .select(CAMPOS_IMOVEL_COMPLETO)
      .eq("organizacao_id", contexto.organizacaoId)
      .ilike("titulo", `%${nome}%`)
      .limit(3)

    if (error) return `Erro ao buscar imóvel: ${error.message}`
    if (!data || data.length === 0) return `Nenhum imóvel encontrado com o nome "${nome}".`

    if (data.length === 1) {
      const url = await montarUrlImovel(contexto.organizacaoId, (data[0] as Record<string, unknown>).id as string)
      return `Imóvel encontrado:\n${formatarImovelCompleto(data[0] as unknown as Record<string, unknown>)}\nLink do site: ${url}\n\nIMPORTANTE: para mandar o card visual (foto + botão) ao cliente, chame a tool enviar_card_imovel com este ID.`
    }

    const lista = data.map((i: Record<string, unknown>) => `- ${i.titulo} (Cód: ${i.codigo_interno || "sem código"}) — ID: ${i.id}`)
    return `Encontrei ${data.length} imóveis com esse nome:\n${lista.join("\n")}\n\nUse o ID para buscar os detalhes completos de um deles.`
  }

  return "Informe o nome, código ou ID do imóvel para buscar."
}

export async function executarBuscarImoveis(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  let query = supabase
    .from("imoveis")
    .select(CAMPOS_IMOVEL_COMPLETO)
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
    query = query.or(`valor.gte.${min},valor_aluguel.gte.${min}`)
  }
  if (args.preco_max) {
    const max = args.preco_max as number
    query = query.or(`valor.lte.${max},valor_aluguel.lte.${max}`)
  }
  if (args.quartos_min) query = query.gte("quartos", args.quartos_min as number)

  const { data: imoveis, error } = await query
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) return `Erro ao buscar imóveis: ${error.message}`
  if (!imoveis || imoveis.length === 0) return "Nenhum imóvel encontrado com esses critérios."

  const linhas: string[] = []
  for (const i of imoveis) {
    const preco = i.valor
      ? `Venda: R$ ${Number(i.valor).toLocaleString("pt-BR")}`
      : i.valor_aluguel
        ? `Aluguel: R$ ${Number(i.valor_aluguel).toLocaleString("pt-BR")}/mês`
        : "Preço sob consulta"
    const url = await montarUrlImovel(contexto.organizacaoId, i.id as string)
    linhas.push(
      `- [${i.id}] ${i.titulo} (Cód: ${i.codigo_interno || "?"}) | ${i.tipo} | ${i.bairro || ""}, ${i.cidade}-${i.estado} | ${preco} | ${i.quartos || 0}q/${i.suites || 0}s/${i.banheiros || 0}b/${i.vagas || 0}v | ${i.area_total || "?"}m² total, ${i.area_construida || "?"}m² constr.${i.valor_condominio ? ` | Cond: R$ ${Number(i.valor_condominio).toLocaleString("pt-BR")}` : ""} | ${url}`
    )
  }

  return `Encontrei ${imoveis.length} imóvel(is):\n${linhas.join("\n")}\n\nIMPORTANTE: pra mandar um card visual rico (foto + botão "Visitar no site") de QUALQUER um destes imóveis, chame a tool enviar_card_imovel com o ID.`
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
      data_vencimento: args.data_vencimento as string,
      cliente_id: (args.cliente_id as string) || null,
      negocio_id: (args.negocio_id as string) || null,
      descricao: (args.descricao as string) || null,
    })

  if (error) return `Erro ao criar atividade: ${error.message}`

  // Atividade agendada (visita, ligação, etc.) = IA terminou seu trabalho
  // Mover negócio para "Novo Lead" para o corretor assumir
  if (contexto.negocioId) {
    await moverNegocioParaNovoLead(supabase, contexto.negocioId, contexto.organizacaoId, usuarioId)
  }

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

  // Mover negócio de "Pré-atendimento IA" para "Novo Lead" (primeira etapa normal)
  if (contexto.negocioId) {
    await moverNegocioParaNovoLead(supabase, contexto.negocioId, contexto.organizacaoId, corretorId)
  }

  // Notificar corretor por email
  if (corretorId) {
    try {
      const { data: corretor } = await supabase
        .from("usuarios")
        .select("email, nome")
        .eq("id", corretorId)
        .single()

      if (corretor?.email) {
        const { enviarEmail } = await import("@/lib/resend")
        const resumo = (args.resumo as string) || "Sem resumo"
        const motivo = (args.motivo as string) || "Lead qualificado pela IA"
        const numero = contexto.numeroCliente || "desconhecido"

        await enviarEmail({
          para: corretor.email,
          assunto: `Novo lead encaminhado — ${numero}`,
          html: `
            <h2>Novo lead encaminhado para você</h2>
            <p><strong>Número:</strong> ${numero}</p>
            <p><strong>Motivo:</strong> ${motivo}</p>
            <p><strong>Resumo da conversa:</strong></p>
            <p>${resumo}</p>
            <br>
            <p>Acesse a plataforma para dar continuidade ao atendimento.</p>
          `,
        })
      }
    } catch (err) {
      console.error("[Encaminhar Corretor] Erro ao notificar:", err instanceof Error ? err.message : err)
      // Não falha o encaminhamento se o email falhar
    }
  }

  return `Conversa encaminhada para o corretor. Motivo: ${args.motivo}`
}

/**
 * Move o negócio da etapa "Pré-atendimento IA" para a primeira etapa "normal" do pipeline.
 * Também atribui o corretor ao negócio se informado.
 */
async function moverNegocioParaNovoLead(
  supabase: ReturnType<Awaited<typeof import("@/lib/supabase/admin")>["criarClienteAdmin"]>,
  negocioId: string,
  organizacaoId: string,
  corretorId: string | null
): Promise<void> {
  try {
    // Verificar se o negócio ainda está em "Pré-atendimento IA"
    // Se o corretor já moveu manualmente, não sobrescrever
    const { data: negocioAtual } = await supabase
      .from("negocios")
      .select("etapa_id, pipeline_etapas(tipo)")
      .eq("id", negocioId)
      .single()

    const tipoEtapaAtual = (negocioAtual?.pipeline_etapas as { tipo?: string } | null)?.tipo
    if (tipoEtapaAtual !== "pre_atendimento_ia") {
      console.log(`[Mover Negócio] Negócio ${negocioId} já saiu do pré-atendimento (etapa: ${tipoEtapaAtual}). Ignorando.`)
      return
    }

    // Buscar primeira etapa normal do pipeline (Novo Lead)
    const { data: etapaNovoLead } = await supabase
      .from("pipeline_etapas")
      .select("id")
      .eq("organizacao_id", organizacaoId)
      .eq("tipo", "normal")
      .order("ordem", { ascending: true })
      .limit(1)
      .single()

    if (!etapaNovoLead) {
      console.error("[Mover Negócio] Etapa 'Novo Lead' não encontrada para org:", organizacaoId)
      return
    }

    // Calcular próxima posição na etapa destino
    const { data: ultimoNegocio } = await supabase
      .from("negocios")
      .select("posicao")
      .eq("etapa_id", etapaNovoLead.id)
      .order("posicao", { ascending: false })
      .limit(1)
      .single()

    const posicao = (ultimoNegocio?.posicao ?? -1) + 1

    // Mover negócio para a nova etapa + atribuir corretor
    const atualizacao: Record<string, unknown> = {
      etapa_id: etapaNovoLead.id,
      posicao,
    }
    if (corretorId) {
      atualizacao.corretor_id = corretorId
    }

    const { error } = await supabase
      .from("negocios")
      .update(atualizacao)
      .eq("id", negocioId)

    if (error) {
      console.error("[Mover Negócio] Erro ao mover negócio para Novo Lead:", error.message)
    } else {
      console.log(`[Mover Negócio] Negócio ${negocioId} movido para Novo Lead (etapa ${etapaNovoLead.id})`)
    }
  } catch (err) {
    console.error("[Mover Negócio] Erro ao mover negócio:", err instanceof Error ? err.message : err)
    // Não falha a operação principal se a movimentação falhar
  }
}

// ============================================================
// Enviar card visual de imóvel (foto + caption rica + link)
// Não usa o canal de mensagem do agente — manda direto via Uazapi
// ============================================================

export async function executarEnviarCardImovel(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const imovelId = args.imovel_id as string | undefined
  if (!imovelId) return "Erro: imovel_id é obrigatório."

  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Buscar imóvel + fotos + config WhatsApp em paralelo
  const [imovelRes, configRes] = await Promise.all([
    supabase
      .from("imoveis")
      .select(`
        ${CAMPOS_IMOVEL_COMPLETO},
        imovel_fotos (url, ordem, eh_capa)
      `)
      .eq("organizacao_id", contexto.organizacaoId)
      .eq("id", imovelId)
      .single(),
    supabase
      .from("config_whatsapp")
      .select("*")
      .eq("organizacao_id", contexto.organizacaoId)
      .single(),
  ])

  if (imovelRes.error || !imovelRes.data) {
    return `Erro: imóvel ${imovelId} não encontrado.`
  }
  if (configRes.error || !configRes.data) {
    return "Erro: config WhatsApp não encontrada."
  }

  const imovel = imovelRes.data as Record<string, unknown> & {
    imovel_fotos?: Array<{ url: string; ordem: number; eh_capa: boolean }>
  }
  const config = configRes.data as unknown as import("@/types/whatsapp").ConfigWhatsapp

  // Pegar foto de capa, ou primeira disponivel
  const fotos = imovel.imovel_fotos || []
  const fotoCapa = fotos.find((f) => f.eh_capa) || fotos.sort((a, b) => a.ordem - b.ordem)[0]
  const url = await montarUrlImovel(contexto.organizacaoId, imovelId)

  // Montar caption rica
  const valor = imovel.valor as number | null
  const valorAluguel = imovel.valor_aluguel as number | null
  const preco = valor
    ? `💰 R$ ${Number(valor).toLocaleString("pt-BR")}`
    : valorAluguel
      ? `💰 R$ ${Number(valorAluguel).toLocaleString("pt-BR")}/mês`
      : "💰 Sob consulta"

  const enderecoLinha = [imovel.bairro, imovel.cidade, imovel.estado]
    .filter(Boolean)
    .join(", ")

  const caption = `🏡 *${imovel.titulo}*
📍 ${enderecoLinha}
${preco}

🛏 ${imovel.quartos || 0} quarto(s) ${imovel.suites ? `(${imovel.suites} suíte)` : ""}
🚿 ${imovel.banheiros || 0} banheiro(s)
🚗 ${imovel.vagas || 0} vaga(s)
📐 ${imovel.area_total ? `${imovel.area_total}m² totais` : "área sob consulta"}

🔗 Veja mais fotos e detalhes:
${url}`

  const { enviarImagem, enviarTexto } = await import("./uazapi")

  try {
    if (fotoCapa?.url) {
      // Manda foto com caption
      await enviarImagem(config, contexto.numeroCliente, fotoCapa.url, caption)
    } else {
      // Sem foto → manda só o texto
      await enviarTexto(config, contexto.numeroCliente, caption)
    }

    // Salvar mensagem no banco (registro da mensagem enviada)
    await supabase
      .from("mensagens_whatsapp")
      .insert({
        conversa_id: contexto.conversaId,
        organizacao_id: contexto.organizacaoId,
        direcao: "enviada",
        tipo_conteudo: fotoCapa?.url ? "imagem" : "texto",
        conteudo: caption,
        conteudo_original: caption,
      })

    return `Card do imóvel "${imovel.titulo}" enviado com foto e link "Visitar no site" pro cliente. Não é necessário repetir essas informações em texto — apenas pergunte se ele tem interesse ou se quer ver mais opções.`
  } catch (erro) {
    console.error("[enviar_card_imovel] Erro:", erro)
    return `Erro ao enviar card: ${erro instanceof Error ? erro.message : "desconhecido"}. Tente passar os detalhes por texto.`
  }
}
