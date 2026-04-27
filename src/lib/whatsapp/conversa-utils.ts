import { criarClienteAdmin } from "@/lib/supabase/admin"

// ============================================================
// Funções compartilhadas de conversa WhatsApp
// Usadas pelo webhook WhatsApp e pelo envio proativo de portais
// ============================================================

type SupabaseAdmin = ReturnType<typeof criarClienteAdmin>

/**
 * Normaliza telefone para formato WhatsApp: apenas dígitos com DDI 55
 * Ex: "(11) 99999-9999" → "5511999999999"
 */
export function normalizarTelefoneWhatsApp(telefone: string): string {
  // Remove tudo que não é dígito
  let limpo = telefone.replace(/\D/g, "")

  // Remove zero à esquerda (0xx)
  if (limpo.startsWith("0")) {
    limpo = limpo.substring(1)
  }

  // Adiciona DDI 55 se não tem
  if (!limpo.startsWith("55")) {
    limpo = "55" + limpo
  }

  return limpo
}

/**
 * Busca conversa existente ou cria uma nova.
 * Retorna o ID e se a conversa foi criada agora (isNova).
 */
export async function buscarOuCriarConversa(
  supabase: SupabaseAdmin,
  organizacaoId: string,
  numeroCliente: string,
  nomeCliente: string | null
): Promise<{ id: string; isNova: boolean }> {
  // Buscar conversa ativa (não arquivada/finalizada) com esse número
  const { data: conversaExistente } = await supabase
    .from("conversas_whatsapp")
    .select("id")
    .eq("organizacao_id", organizacaoId)
    .eq("numero_cliente", numeroCliente)
    .in("status", ["em_andamento", "qualificado", "encaminhado"])
    .order("criado_em", { ascending: false })
    .limit(1)
    .single()

  if (conversaExistente) {
    return { id: conversaExistente.id, isNova: false }
  }

  // LYNEDES-103 Sprint 2: detectar retorno
  // Antes de criar nova, verificar se ja existiu conversa anterior encerrada
  // (encaminhado/finalizado/arquivado). Se sim, abrir novo ciclo nessa conversa.
  const { data: conversaAnterior } = await supabase
    .from("conversas_whatsapp")
    .select("id, ciclo_atual")
    .eq("organizacao_id", organizacaoId)
    .eq("numero_cliente", numeroCliente)
    .in("status", ["finalizado", "arquivado"])
    .order("criado_em", { ascending: false })
    .limit(1)
    .single()

  if (conversaAnterior) {
    const novoCiclo = (conversaAnterior.ciclo_atual ?? 1) + 1
    await supabase
      .from("conversas_whatsapp")
      .update({
        status: "em_andamento",
        eh_retorno: true,
        ciclo_atual: novoCiclo,
        ultima_mensagem_em: new Date().toISOString(),
        nome_cliente: nomeCliente || undefined,
      })
      .eq("id", conversaAnterior.id)

    console.log(`[Conversa] Retorno detectado para ${numeroCliente} — ciclo ${novoCiclo} aberto`)
    return { id: conversaAnterior.id, isNova: false }
  }

  // Criar nova conversa (com proteção contra race condition)
  // Se 5 webhooks chegam ao mesmo tempo, todos tentam INSERT.
  // O unique index parcial garante que só 1 consegue — os outros recebem erro 23505.
  const { data: novaConversa, error: erroConversa } = await supabase
    .from("conversas_whatsapp")
    .insert({
      organizacao_id: organizacaoId,
      numero_cliente: numeroCliente,
      nome_cliente: nomeCliente,
      status: "em_andamento",
      ciclo_atual: 1,
      eh_retorno: false,
      ultima_mensagem_em: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (erroConversa) {
    // Erro 23505 = unique violation — outra invocação criou a conversa primeiro
    if (erroConversa.code === "23505") {
      const { data: conversaCriada } = await supabase
        .from("conversas_whatsapp")
        .select("id")
        .eq("organizacao_id", organizacaoId)
        .eq("numero_cliente", numeroCliente)
        .in("status", ["em_andamento", "qualificado", "encaminhado"])
        .order("criado_em", { ascending: false })
        .limit(1)
        .single()

      if (conversaCriada) {
        return { id: conversaCriada.id, isNova: false }
      }
    }
    throw new Error(`Erro ao criar conversa: ${erroConversa.message}`)
  }

  return { id: novaConversa.id, isNova: true }
}

/**
 * Cria cliente e negócio automaticamente no primeiro contato.
 * O cliente é criado sem nome (será preenchido pela IA quando souber).
 * O negócio é criado na etapa "Pré-atendimento IA".
 *
 * Opções extras permitem pular a detecção automática de portal
 * quando os dados já são conhecidos (ex: chamado do webhook de portais).
 */
export async function criarClienteENegocioInicial(
  supabase: SupabaseAdmin,
  organizacaoId: string,
  numeroCliente: string,
  conversaId: string,
  config: Record<string, unknown>,
  opcoes?: {
    nomeCliente?: string
    origemLead?: "portal" | "site" | "whatsapp"
    imovelInteresseId?: string
  }
): Promise<{ clienteId: string; negocioId: string } | null> {
  try {
    // Buscar etapa "Pré-atendimento IA"
    const { data: etapa } = await supabase
      .from("pipeline_etapas")
      .select("id")
      .eq("organizacao_id", organizacaoId)
      .eq("tipo", "pre_atendimento_ia")
      .single()

    if (!etapa) {
      console.error("[conversa-utils] Etapa pré-atendimento IA não encontrada para org:", organizacaoId)
      return null
    }

    // Obter corretor: corretor padrão da config ou admin da org
    let corretorId = (config.corretor_padrao_id as string) || null
    if (!corretorId) {
      const { data: admin } = await supabase
        .from("usuarios")
        .select("id")
        .eq("organizacao_id", organizacaoId)
        .eq("cargo", "admin")
        .limit(1)
        .single()
      corretorId = admin?.id || null
    }

    if (!corretorId) {
      console.error("[conversa-utils] Nenhum corretor encontrado para org:", organizacaoId)
      return null
    }

    // Verificar se já existe cliente com este número (cliente retornando após negócio anterior)
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("organizacao_id", organizacaoId)
      .or(`telefone.eq.${numeroCliente},whatsapp.eq.${numeroCliente}`)
      .limit(1)
      .single()

    let clienteId: string

    if (clienteExistente) {
      // Reusar cliente existente — ele já está cadastrado na plataforma
      clienteId = clienteExistente.id
      console.log(`[conversa-utils] Cliente existente reutilizado: ${clienteId}`)
    } else {
      // Criar cliente (com nome se disponível, senão placeholder)
      const nomeCliente = opcoes?.nomeCliente || "Contato WhatsApp"
      const origem = opcoes?.origemLead === "portal" || opcoes?.origemLead === "site"
        ? "portal"
        : "whatsapp"

      const { data: clienteNovo, error: erroCliente } = await supabase
        .from("clientes")
        .insert({
          organizacao_id: organizacaoId,
          corretor_id: corretorId,
          nome: nomeCliente,
          telefone: numeroCliente,
          whatsapp: numeroCliente,
          tipo: "comprador",
          origem,
        })
        .select("id")
        .single()

      if (erroCliente || !clienteNovo) {
        console.error("[conversa-utils] Erro ao criar cliente inicial:", erroCliente?.message)
        return null
      }
      clienteId = clienteNovo.id
    }

    // Calcular próxima posição na etapa
    const { data: ultimoNegocio } = await supabase
      .from("negocios")
      .select("posicao")
      .eq("etapa_id", etapa.id)
      .order("posicao", { ascending: false })
      .limit(1)
      .single()

    const posicao = (ultimoNegocio?.posicao ?? -1) + 1

    // Criar negócio na etapa pré-atendimento
    const tituloNegocio = opcoes?.origemLead
      ? `Lead ${opcoes.origemLead === "site" ? "Site" : "Portal"} — WhatsApp`
      : "Atendimento WhatsApp"

    const { data: negocio, error: erroNegocio } = await supabase
      .from("negocios")
      .insert({
        organizacao_id: organizacaoId,
        corretor_id: corretorId,
        cliente_id: clienteId,
        etapa_id: etapa.id,
        titulo: tituloNegocio,
        tipo: "venda",
        posicao,
      })
      .select("id")
      .single()

    if (erroNegocio || !negocio) {
      console.error("[conversa-utils] Erro ao criar negócio inicial:", erroNegocio?.message)
      return null
    }

    // Vincular cliente e negócio à conversa
    await supabase
      .from("conversas_whatsapp")
      .update({
        cliente_id: clienteId,
        negocio_id: negocio.id,
      })
      .eq("id", conversaId)

    console.log(`[conversa-utils] Cliente ${clienteId} e negócio ${negocio.id} vinculados à conversa ${conversaId}`)

    // Se a origem foi fornecida diretamente (chamada do portal), setar na conversa
    if (opcoes?.origemLead) {
      await supabase
        .from("conversas_whatsapp")
        .update({
          origem_lead: opcoes.origemLead,
          ...(opcoes.imovelInteresseId ? { imovel_interesse_id: opcoes.imovelInteresseId } : {}),
        })
        .eq("id", conversaId)
    } else {
      // Detecção automática: buscar lead de portal recente (últimos 30 dias)
      const { data: leadPortal } = await supabase
        .from("leads_portais")
        .select("portal, imovel_id")
        .eq("organizacao_id", organizacaoId)
        .eq("telefone", numeroCliente)
        .in("status", ["novo", "processado"])
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (leadPortal) {
        const origemLead = leadPortal.portal === "site" ? "site" : "portal"
        await supabase
          .from("conversas_whatsapp")
          .update({
            origem_lead: origemLead,
            ...(leadPortal.imovel_id ? { imovel_interesse_id: leadPortal.imovel_id } : {}),
          })
          .eq("id", conversaId)
        console.log(`[conversa-utils] Origem detectada: ${origemLead} | Imóvel: ${leadPortal.imovel_id ?? "nenhum"}`)
      }
    }

    return { clienteId, negocioId: negocio.id }
  } catch (erro) {
    console.error("[conversa-utils] Erro ao criar cliente/negócio inicial:", erro instanceof Error ? erro.message : erro)
    return null
  }
}
