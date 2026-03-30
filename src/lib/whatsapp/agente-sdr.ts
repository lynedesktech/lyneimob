import type { ConfigWhatsapp, HorarioAtendimento } from "@/types/whatsapp"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

// ============================================================
// Orquestrador do agente SDR WhatsApp
// Recebe conversa do debounce → monta contexto → chama IA →
// executa tools → envia resposta humanizada
// ============================================================

const MAX_ITERACOES_TOOLS = 3

/**
 * Processa conversa com o agente IA
 * Chamado pelo debounce após agrupar mensagens
 */
export async function processarComAgente(
  conversaId: string,
  organizacaoId: string
): Promise<void> {
  // Lock Redis: impedir processamento simultâneo da mesma conversa
  // Se outra instância já está processando, abortar silenciosamente
  const { redis } = await import("@/lib/redis")
  const chaveLock = `lock:agente:${conversaId}`

  if (redis) {
    // SET NX = só seta se não existir, EX = TTL de 60s (segurança)
    const adquiriu = await redis.set(chaveLock, "1", { nx: true, ex: 60 })
    if (!adquiriu) {
      console.log(`[Agente SDR] Conversa ${conversaId} já está sendo processada, ignorando.`)
      return
    }
  }

  try {
    const { criarClienteAdmin } = await import("@/lib/supabase/admin")
    const supabase = criarClienteAdmin()

    // 1. Buscar config WhatsApp da org
    const { data: config } = await supabase
      .from("config_whatsapp")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .eq("ativo", true)
      .single()

    if (!config) {
      console.error(`[Agente SDR] Config WhatsApp não encontrada para org ${organizacaoId}`)
      return
    }

    const configTyped = config as unknown as ConfigWhatsapp

    // 2. Buscar dados da conversa (incluindo canal de origem)
    const { data: conversa } = await supabase
      .from("conversas_whatsapp")
      .select("*, origem_lead, imovel_interesse_id")
      .eq("id", conversaId)
      .single()

    if (!conversa) {
      console.error(`[Agente SDR] Conversa ${conversaId} não encontrada`)
      return
    }

    // Não processar conversas encaminhadas ou finalizadas
    if (conversa.status === "encaminhado" || conversa.status === "finalizado" || conversa.status === "arquivado") {
      return
    }

    // Verificar se o negócio está na etapa "Pré-atendimento IA"
    // A IA só atende enquanto o card estiver nessa etapa
    if (conversa.negocio_id) {
      const { data: negocioEtapa } = await supabase
        .from("negocios")
        .select("pipeline_etapas(tipo)")
        .eq("id", conversa.negocio_id)
        .single()

      const tipoEtapa = (negocioEtapa?.pipeline_etapas as { tipo?: string } | null)?.tipo
      if (tipoEtapa && tipoEtapa !== "pre_atendimento_ia") {
        console.log(`[Agente SDR] Conversa ${conversaId}: negócio fora do pré-atendimento IA (etapa: ${tipoEtapa}). IA desativada.`)
        return
      }
    }

    // 3. Verificar horário de atendimento
    if (configTyped.horario_atendimento) {
      const foraDoHorario = verificarForaHorario(configTyped.horario_atendimento)
      if (foraDoHorario) {
        const mensagemFora = configTyped.mensagem_fora_horario
          || "Olá! No momento estamos fora do horário de atendimento. Retornaremos em breve!"

        const { enviarHumanizado } = await import("./humanizar")
        await enviarHumanizado(configTyped, conversa.numero_cliente, mensagemFora)

        // Salvar mensagem enviada no banco
        await salvarMensagemEnviada(supabase, conversaId, organizacaoId, mensagemFora)
        return
      }
    }

    // 4. Verificar rate limit da OpenAI
    const { verificarLimiteOpenAI } = await import("@/lib/rate-limit")
    const limite = await verificarLimiteOpenAI(organizacaoId)
    if (!limite.permitido) {
      console.warn(`[Agente SDR] Rate limit atingido para org ${organizacaoId}. Restante: ${limite.restante}`)
      return
    }

    // 5. Buscar nome da organização
    const { data: org } = await supabase
      .from("organizacoes")
      .select("nome")
      .eq("id", organizacaoId)
      .single()

    const nomeOrganizacao = org?.nome || "Imobiliária"

    // 5. Buscar mensagens recentes não respondidas
    const { data: mensagensRecentes } = await supabase
      .from("mensagens_whatsapp")
      .select("direcao, conteudo, tipo_conteudo, criado_em")
      .eq("conversa_id", conversaId)
      .order("criado_em", { ascending: false })
      .limit(30)

    if (!mensagensRecentes || mensagensRecentes.length === 0) {
      return
    }

    // Reverter para ordem cronológica
    const mensagensOrdenadas = mensagensRecentes.reverse()

    // 6. Buscar memória do Redis
    const { buscarMemoria, salvarMensagemMemoria } = await import("./memoria")
    const memoriaExistente = await buscarMemoria(conversaId)

    // 7. Montar system prompt
    const { montarPromptSdr } = await import("./prompt-sdr")
    const systemPrompt = montarPromptSdr(configTyped, nomeOrganizacao)

    // Montar contexto da conversa para a IA
    // O nome só é incluído quando o cliente foi formalmente registrado no sistema
    // (cliente_id existe), evitando usar o nome do perfil do WhatsApp que pode ser qualquer coisa
    const nomeCliente = conversa.nome_cliente || null
    const jaRespondeu = mensagensOrdenadas.some((m) => m.direcao === "enviada")
    const nomeVerificado = conversa.cliente_id && nomeCliente ? `\n- Nome do cliente: ${nomeCliente}` : ""

    // Detectar reativação: já respondemos antes, mas última mensagem foi há mais de 24h
    const agora = new Date()
    const ultimaMensagemEm = conversa.ultima_mensagem_em ? new Date(conversa.ultima_mensagem_em) : null
    const horasDecorridas = ultimaMensagemEm
      ? (agora.getTime() - ultimaMensagemEm.getTime()) / (1000 * 60 * 60)
      : 0
    const ehReativacao = jaRespondeu && horasDecorridas > 24

    const statusConversa = !jaRespondeu
      ? "PRIMEIRA_RESPOSTA"
      : ehReativacao
        ? "REATIVACAO"
        : "EM_ANDAMENTO"

    let contextoExtra = `\n\nCONTEXTO DA CONVERSA:${nomeVerificado}
- Número WhatsApp: ${conversa.numero_cliente}
- Status da conversa: ${statusConversa}`

    // Adicionar qualificação existente se houver
    if (conversa.qualificacao) {
      try {
        const q = conversa.qualificacao as Record<string, unknown>
        const partes: string[] = []
        if (q.tipo_imovel) partes.push(`Tipo: ${q.tipo_imovel}`)
        if (q.finalidade) partes.push(`Finalidade: ${q.finalidade}`)
        if (Array.isArray(q.bairros)) partes.push(`Bairros: ${q.bairros.join(", ")}`)
        if (q.faixa_preco && typeof q.faixa_preco === "object") {
          const fp = q.faixa_preco as { min?: number; max?: number }
          const min = fp.min ? `R$ ${fp.min.toLocaleString("pt-BR")}` : "sem mínimo"
          const max = fp.max ? `R$ ${fp.max.toLocaleString("pt-BR")}` : "sem máximo"
          partes.push(`Faixa de preço: ${min} a ${max}`)
        }
        if (q.urgencia) partes.push(`Urgência: ${q.urgencia}`)
        if (partes.length > 0) {
          contextoExtra += `\n\nDADOS DE QUALIFICAÇÃO JÁ COLETADOS:\n${partes.join("\n")}`
        }
      } catch {
        // Qualificação com formato inesperado — ignorar sem crashar
      }
    }

    if (conversa.cliente_id) {
      contextoExtra += "\n\nOBS: Cliente já foi criado na plataforma."
    }
    if (conversa.negocio_id) {
      contextoExtra += "\nOBS: Negócio já foi criado no pipeline."
    }

    // Canal de origem do lead
    const origemLead = (conversa.origem_lead as string | null) || "whatsapp"
    contextoExtra += `\n- Canal de origem: ${origemLead.toUpperCase()}`

    // Se há imóvel de interesse (lead de portal com imóvel específico), buscar dados
    if (conversa.imovel_interesse_id) {
      const { data: imovelInteresse } = await supabase
        .from("imoveis")
        .select("titulo, tipo, bairro, valor, valor_aluguel")
        .eq("id", conversa.imovel_interesse_id as string)
        .single()

      if (imovelInteresse) {
        const preco = imovelInteresse.valor
          ? `R$ ${Number(imovelInteresse.valor).toLocaleString("pt-BR")}`
          : imovelInteresse.valor_aluguel
            ? `R$ ${Number(imovelInteresse.valor_aluguel).toLocaleString("pt-BR")}/mês`
            : "preço sob consulta"
        contextoExtra += `\n- Imóvel de interesse: ${imovelInteresse.titulo} | ${imovelInteresse.tipo} | ${imovelInteresse.bairro} | ${preco}`
      }
    }

    // 8. Montar messages array
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt + contextoExtra },
    ]

    // Adicionar memória (histórico anterior)
    for (const msg of memoriaExistente) {
      messages.push({
        role: msg.papel === "usuario" ? "user" : "assistant",
        content: msg.conteudo,
      })
    }

    // Adicionar mensagens novas (do lote do debounce)
    // Identificar mensagens que ainda não estão na memória
    const mensagensNovas = identificarMensagensNovas(
      mensagensOrdenadas,
      memoriaExistente.length
    )

    for (const msg of mensagensNovas) {
      if (msg.direcao === "recebida") {
        let conteudoFormatado: string
        if (msg.tipo_conteudo === "audio") {
          conteudoFormatado = "[cliente enviou uma mensagem de voz — sem transcrição disponível]"
        } else if (msg.tipo_conteudo === "imagem") {
          conteudoFormatado = msg.conteudo
            ? `[cliente enviou uma imagem com legenda: ${msg.conteudo}]`
            : "[cliente enviou uma imagem]"
        } else if (msg.tipo_conteudo === "video") {
          conteudoFormatado = "[cliente enviou um vídeo]"
        } else if (msg.tipo_conteudo === "documento") {
          conteudoFormatado = "[cliente enviou um documento]"
        } else if (msg.tipo_conteudo === "sticker") {
          conteudoFormatado = "[cliente enviou um sticker]"
        } else {
          conteudoFormatado = msg.conteudo || "[mensagem sem conteúdo]"
        }
        messages.push({ role: "user", content: conteudoFormatado })
      }
    }

    // Se não há mensagens novas do usuário, não processar
    const temMensagemUsuario = messages.some(
      (m) => m.role === "user"
    )
    if (!temMensagemUsuario) {
      return
    }

    // 9. Chamar OpenAI com tools
    const { getOpenAI } = await import("@/lib/openai")
    const { definicaoToolsSdr, executarTool } = await import("./tools-sdr")

    const contextoTool = {
      conversaId,
      organizacaoId,
      numeroCliente: conversa.numero_cliente,
      clienteId: conversa.cliente_id ?? null,
      negocioId: conversa.negocio_id ?? null,
    }

    let respostaFinal: string | null = null

    for (let iteracao = 0; iteracao < MAX_ITERACOES_TOOLS + 1; iteracao++) {
      const resposta = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: definicaoToolsSdr,
        temperature: 0.7,
        max_tokens: 1000,
      })

      const escolha = resposta.choices[0]
      if (!escolha) break

      const mensagemIA = escolha.message

      // Se a IA quer chamar tools
      if (mensagemIA.tool_calls && mensagemIA.tool_calls.length > 0 && iteracao < MAX_ITERACOES_TOOLS) {
        // Adicionar mensagem da IA com tool_calls
        messages.push(mensagemIA)

        // Executar cada tool (filtrar apenas function calls)
        for (const toolCall of mensagemIA.tool_calls) {
          if (toolCall.type !== "function") continue

          let args: Record<string, unknown>
          try {
            args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>
          } catch {
            console.error(`[Agente SDR] JSON inválido nos argumentos da tool ${toolCall.function.name}:`, toolCall.function.arguments)
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: "Erro: argumentos inválidos. Tente novamente.",
            })
            continue
          }

          const resultado = await executarTool(
            toolCall.function.name,
            args,
            contextoTool
          )

          // Adicionar resultado do tool
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultado,
          })
        }

        // Continuar o loop para a IA processar os resultados
        continue
      }

      // Resposta final (sem tool calls ou iteração máxima)
      respostaFinal = mensagemIA.content?.trim() || null
      break
    }

    if (!respostaFinal) {
      console.error(`[Agente SDR] IA não retornou resposta para conversa ${conversaId}`)
      return
    }

    // 10. Enviar resposta humanizada
    const { enviarHumanizado } = await import("./humanizar")
    await enviarHumanizado(configTyped, conversa.numero_cliente, respostaFinal)

    // 11. Salvar mensagem enviada no banco
    await salvarMensagemEnviada(supabase, conversaId, organizacaoId, respostaFinal)

    // 12. Salvar memória no Redis
    // Salvar mensagens novas do usuário
    for (const msg of mensagensNovas) {
      if (msg.direcao === "recebida" && msg.conteudo) {
        await salvarMensagemMemoria(conversaId, "usuario", msg.conteudo)
      }
    }
    // Salvar resposta da IA
    await salvarMensagemMemoria(conversaId, "assistente", respostaFinal)
  } catch (erro) {
    console.error(
      `[Agente SDR] Erro ao processar conversa ${conversaId}:`,
      erro instanceof Error ? `${erro.message}\n${erro.stack}` : erro
    )
  } finally {
    // Liberar lock independente de sucesso ou erro
    if (redis) {
      await redis.del(chaveLock).catch(() => {})
    }
  }
}

// ============================================================
// Funções auxiliares
// ============================================================

/**
 * Verifica se o horário atual está fora do horário de atendimento
 */
function verificarForaHorario(horario: HorarioAtendimento): boolean {
  const agora = new Date()
  const diasSemana: Array<keyof HorarioAtendimento> = [
    "domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado",
  ]
  const diaAtual = diasSemana[agora.getDay()]
  const configuracaoDia = horario[diaAtual]

  // Se não tem configuração pro dia, está fora do horário
  if (!configuracaoDia) return true

  const horaAtual = `${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}`

  return horaAtual < configuracaoDia.inicio || horaAtual > configuracaoDia.fim
}

/**
 * Identifica mensagens que são novas (não estão na memória)
 */
function identificarMensagensNovas(
  mensagens: Array<{
    direcao: string
    conteudo: string | null
    tipo_conteudo: string
    criado_em: string
  }>,
  tamanhoMemoria: number
): Array<{
  direcao: string
  conteudo: string | null
  tipo_conteudo: string
  criado_em: string
}> {
  // Se não tem memória, pegar as mensagens recebidas mais recentes
  if (tamanhoMemoria === 0) {
    // Retornar todas as mensagens recebidas recentes
    return mensagens.filter((m) => m.direcao === "recebida")
  }

  // Pegar mensagens após a última mensagem na memória
  // A memória contém pares usuario/assistente, então estimamos
  // que as últimas N mensagens do banco já estão na memória
  // Pegamos apenas as mensagens recebidas que vieram depois da última resposta enviada
  const indiceUltimaEnviada = mensagens.findLastIndex(
    (m) => m.direcao === "enviada"
  )

  if (indiceUltimaEnviada === -1) {
    // Nunca respondeu — todas as recebidas são novas
    return mensagens.filter((m) => m.direcao === "recebida")
  }

  // Mensagens recebidas após a última resposta enviada
  return mensagens
    .slice(indiceUltimaEnviada + 1)
    .filter((m) => m.direcao === "recebida")
}

/**
 * Salva mensagem enviada pela IA no banco
 */
async function salvarMensagemEnviada(
  supabase: ReturnType<Awaited<typeof import("@/lib/supabase/admin")>["criarClienteAdmin"]>,
  conversaId: string,
  organizacaoId: string,
  conteudo: string
): Promise<void> {
  await supabase
    .from("mensagens_whatsapp")
    .insert({
      conversa_id: conversaId,
      organizacao_id: organizacaoId,
      direcao: "enviada",
      tipo_conteudo: "texto",
      conteudo,
      conteudo_original: conteudo,
    })

  // Atualizar timestamp da última mensagem na conversa
  await supabase
    .from("conversas_whatsapp")
    .update({ ultima_mensagem_em: new Date().toISOString() })
    .eq("id", conversaId)
}
