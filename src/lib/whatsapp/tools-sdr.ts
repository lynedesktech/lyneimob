import type { ChatCompletionTool } from "openai/resources/chat/completions"
import { obterProximoCorretor } from "@/lib/distribuicao-leads"

// ============================================================
// Tools (function calling) do agente SDR
// Define as funções que a IA pode chamar durante a conversa
// e os executores que interagem com o banco via admin client
// ============================================================

type ContextoTool = {
  conversaId: string
  organizacaoId: string
  numeroCliente: string
}

/**
 * Busca o corretor via distribuição, com fallback para corretor padrão do WhatsApp ou admin
 */
async function obterCorretorParaAtribuicao(organizacaoId: string): Promise<string | null> {
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
// Definição dos tools no formato OpenAI
// ============================================================

export const definicaoToolsSdr: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_imoveis",
      description:
        "Buscar imóveis disponíveis no sistema que correspondam aos critérios do cliente. Use sempre que precisar apresentar opções de imóveis.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: [
              "apartamento", "casa", "terreno", "sala_comercial",
              "galpao", "cobertura", "kitnet", "fazenda", "sitio", "loja",
            ],
            description: "Tipo do imóvel",
          },
          finalidade: {
            type: "string",
            enum: ["venda", "aluguel"],
            description: "Se o cliente quer comprar ou alugar",
          },
          cidade: {
            type: "string",
            description: "Cidade do imóvel",
          },
          bairro: {
            type: "string",
            description: "Bairro do imóvel",
          },
          preco_min: {
            type: "number",
            description: "Preço mínimo em reais",
          },
          preco_max: {
            type: "number",
            description: "Preço máximo em reais",
          },
          quartos_min: {
            type: "integer",
            description: "Quantidade mínima de quartos",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_cliente",
      description:
        "Criar um novo cliente no CRM com os dados coletados na conversa. Use quando souber pelo menos o nome do cliente.",
      parameters: {
        type: "object",
        properties: {
          nome: {
            type: "string",
            description: "Nome completo do cliente",
          },
          email: {
            type: "string",
            description: "Email do cliente (se informado)",
          },
          tipo: {
            type: "string",
            enum: ["comprador", "vendedor", "locatario", "proprietario"],
            description: "Tipo de interesse do cliente",
          },
          observacoes: {
            type: "string",
            description: "Observações relevantes sobre o cliente",
          },
        },
        required: ["nome", "tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_negocio",
      description:
        "Criar um negócio no pipeline de vendas para acompanhar a oportunidade. Use após criar o cliente e quando houver interesse real em um imóvel.",
      parameters: {
        type: "object",
        properties: {
          titulo: {
            type: "string",
            description: "Título do negócio (ex: 'Venda - Apto Centro para João')",
          },
          cliente_id: {
            type: "string",
            description: "ID do cliente (retornado por criar_cliente)",
          },
          imovel_id: {
            type: "string",
            description: "ID do imóvel de interesse (retornado por buscar_imoveis)",
          },
          tipo: {
            type: "string",
            enum: ["venda", "aluguel"],
            description: "Tipo do negócio",
          },
          valor: {
            type: "number",
            description: "Valor estimado do negócio em reais",
          },
        },
        required: ["titulo", "cliente_id", "tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_atividade",
      description:
        "Agendar uma atividade para o corretor (visita, ligação, follow-up). Use quando combinar algo com o cliente ou quando o lead estiver qualificado.",
      parameters: {
        type: "object",
        properties: {
          titulo: {
            type: "string",
            description: "Título da atividade (ex: 'Ligar para João - Apto Centro')",
          },
          tipo: {
            type: "string",
            enum: ["ligacao", "email", "visita", "reuniao", "follow_up", "proposta", "outro"],
            description: "Tipo da atividade",
          },
          data_inicio: {
            type: "string",
            description: "Data e hora no formato ISO (ex: '2026-03-16T10:00:00')",
          },
          cliente_id: {
            type: "string",
            description: "ID do cliente vinculado",
          },
          negocio_id: {
            type: "string",
            description: "ID do negócio vinculado",
          },
          descricao: {
            type: "string",
            description: "Descrição ou notas para o corretor",
          },
        },
        required: ["titulo", "tipo", "data_inicio"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "salvar_qualificacao",
      description:
        "Salvar os dados de qualificação extraídos da conversa. Use sempre que coletar informações sobre o que o cliente procura. Pode chamar várias vezes — os dados são mesclados.",
      parameters: {
        type: "object",
        properties: {
          tipo_imovel: {
            type: "string",
            description: "Tipo de imóvel desejado",
          },
          finalidade: {
            type: "string",
            description: "Finalidade (comprar, alugar, vender)",
          },
          bairros: {
            type: "array",
            items: { type: "string" },
            description: "Bairros de interesse",
          },
          faixa_preco: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" },
            },
            description: "Faixa de preço em reais",
          },
          urgencia: {
            type: "string",
            enum: ["alta", "media", "baixa"],
            description: "Urgência do cliente",
          },
          observacoes: {
            type: "string",
            description: "Observações adicionais sobre a qualificação",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "encaminhar_corretor",
      description:
        "Encaminhar a conversa para um corretor humano. Use quando o lead estiver qualificado e pronto para atendimento personalizado, ou quando o cliente pedir para falar com um humano.",
      parameters: {
        type: "object",
        properties: {
          motivo: {
            type: "string",
            description: "Motivo do encaminhamento (ex: 'lead qualificado', 'pediu atendimento humano')",
          },
          resumo: {
            type: "string",
            description: "Resumo da conversa para o corretor (2-3 frases)",
          },
        },
        required: ["motivo", "resumo"],
      },
    },
  },
]

// ============================================================
// Executores dos tools
// ============================================================

/**
 * Executa um tool chamado pela IA e retorna resultado legível
 */
export async function executarTool(
  nome: string,
  argumentos: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  switch (nome) {
    case "buscar_imoveis":
      return executarBuscarImoveis(argumentos, contexto)
    case "criar_cliente":
      return executarCriarCliente(argumentos, contexto)
    case "criar_negocio":
      return executarCriarNegocio(argumentos, contexto)
    case "criar_atividade":
      return executarCriarAtividade(argumentos, contexto)
    case "salvar_qualificacao":
      return executarSalvarQualificacao(argumentos, contexto)
    case "encaminhar_corretor":
      return executarEncaminharCorretor(argumentos, contexto)
    default:
      return `Ferramenta "${nome}" não reconhecida.`
  }
}

// ============================================================
// Implementação de cada executor
// ============================================================

async function executarBuscarImoveis(
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

async function executarCriarCliente(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Obter corretor via distribuição (roleta/balanceamento/manual) com fallback
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

async function executarCriarNegocio(
  args: Record<string, unknown>,
  contexto: ContextoTool
): Promise<string> {
  const { criarClienteAdmin } = await import("@/lib/supabase/admin")
  const supabase = criarClienteAdmin()

  // Buscar primeira etapa do pipeline (Novo Lead)
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

async function executarCriarAtividade(
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

async function executarSalvarQualificacao(
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

async function executarEncaminharCorretor(
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
