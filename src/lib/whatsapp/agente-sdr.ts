import type Anthropic from "@anthropic-ai/sdk"
import type { ConfigWhatsapp, HorarioAtendimento } from "@/types/whatsapp"

// ============================================================
// Orquestrador do agente SDR WhatsApp
// Recebe conversa do debounce → monta contexto → chama IA →
// executa tools → envia resposta humanizada
// ============================================================

// LYNEDES-103 Sprint 3: aumentado de 3 para 7
// Fluxos complexos (buscar imovel + qualificar + agendar + encaminhar) precisam de mais iteracoes
const MAX_ITERACOES_TOOLS = 7

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
    // LYNEDES-103 Sprint 2: check do toggle global da IA antes de qualquer coisa
    const { isIAGlobalEnabled } = await import("./ia-toggle")
    const iaGlobalAtiva = await isIAGlobalEnabled()
    if (!iaGlobalAtiva) {
      console.log(`[Agente SDR] IA NÃO RESPONDEU — IA desativada globalmente (master switch off)`)
      return
    }

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
      console.error(`[Agente SDR] IA NÃO RESPONDEU — Config WhatsApp não encontrada para org ${organizacaoId}`)
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
      console.error(`[Agente SDR] IA NÃO RESPONDEU — Conversa ${conversaId} não encontrada no banco`)
      return
    }

    // LYNEDES-103 Sprint 2: check de bloqueio por contato (auto-block quando humano responde)
    const { isContactBlocked } = await import("./ia-toggle")
    const contatoBloqueado = await isContactBlocked(conversa.numero_cliente, organizacaoId)
    if (contatoBloqueado) {
      console.log(`[Agente SDR] IA NÃO RESPONDEU — Contato ${conversa.numero_cliente} bloqueado (humano respondeu manualmente)`)
      return
    }

    // Não processar conversas encaminhadas ou finalizadas
    if (conversa.status === "encaminhado" || conversa.status === "finalizado" || conversa.status === "arquivado") {
      console.log(`[Agente SDR] Conversa ${conversaId}: ignorada — status "${conversa.status}". IA não responde neste estado.`)
      return
    }

    // Log informativo da etapa do pipeline (não bloqueia mais)
    // A IA continua respondendo enquanto a conversa estiver ativa (em_andamento/qualificado)
    // O controle correto é pelo status da conversa, não pela etapa do negócio
    if (conversa.negocio_id) {
      const { data: negocioEtapa } = await supabase
        .from("negocios")
        .select("pipeline_etapas(tipo)")
        .eq("id", conversa.negocio_id)
        .single()

      const tipoEtapa = (negocioEtapa?.pipeline_etapas as { tipo?: string } | null)?.tipo
      if (tipoEtapa && tipoEtapa !== "pre_atendimento_ia") {
        console.log(`[Agente SDR] Conversa ${conversaId}: negócio na etapa "${tipoEtapa}" (fora do pré-atendimento). IA continua respondendo pois conversa está "${conversa.status}".`)
      }
    }

    // 3. Verificar horário de atendimento
    if (configTyped.horario_atendimento) {
      const foraDoHorario = verificarForaHorario(configTyped.horario_atendimento)
      if (foraDoHorario) {
        // Enviar mensagem de ausência só uma vez por dia pra evitar spam
        const { redis } = await import("@/lib/redis")
        const chaveAusencia = `absence_sent:${organizacaoId}:${conversa.numero_cliente}`
        const jaEnviou = redis ? await redis.get(chaveAusencia) : null

        if (!jaEnviou) {
          const mensagemFora = configTyped.mensagem_fora_horario
            || "Olá! No momento estamos fora do horário de atendimento. Retornaremos em breve!"

          const { enviarHumanizado } = await import("./humanizar")
          await enviarHumanizado(configTyped, conversa.numero_cliente, mensagemFora)

          // Salvar mensagem enviada no banco
          await salvarMensagemEnviada(supabase, conversaId, organizacaoId, mensagemFora)

          // Marca envio por 20h pra não repetir no mesmo dia
          if (redis) {
            await redis.set(chaveAusencia, "1", { ex: 20 * 60 * 60 })
          }
          console.log(`[Agente SDR] Mensagem de ausência enviada pra ${conversa.numero_cliente} (fora do horário)`)
        } else {
          console.log(`[Agente SDR] Conversa ${conversaId}: fora do horário, mas ausência já foi enviada hoje`)
        }
        return
      }
    }

    // 4. Verificar rate limit da Anthropic
    const { verificarLimiteIA } = await import("@/lib/rate-limit")
    const limite = await verificarLimiteIA(organizacaoId)
    if (!limite.permitido) {
      console.warn(`[Agente SDR] IA NÃO RESPONDEU — Rate limit Anthropic atingido para org ${organizacaoId}. Restante: ${limite.restante}`)
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
      .select("direcao, conteudo, tipo_conteudo, criado_em, message_id_whatsapp")
      .eq("conversa_id", conversaId)
      .order("criado_em", { ascending: false })
      .limit(30)

    if (!mensagensRecentes || mensagensRecentes.length === 0) {
      console.log(`[Agente SDR] IA NÃO RESPONDEU — Conversa ${conversaId}: nenhuma mensagem encontrada no banco`)
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
    // O pushName do WhatsApp pode ser QUALQUER coisa ("Deus", emoji, nome de empresa).
    // Sanitizamos pra um primeiro nome plausível; se não for, o nome NÃO entra no contexto
    // e o agente trata como desconhecido (pergunta "com quem tenho o prazer de falar?").
    const { extrairPrimeiroNomeValido } = await import("./nome-contato")
    const nomeCliente = extrairPrimeiroNomeValido(conversa.nome_cliente)
    const jaRespondeu = mensagensOrdenadas.some((m) => m.direcao === "enviada")
    const nomeVerificado = nomeCliente ? `\n- Nome do cliente: ${nomeCliente}` : ""

    // Detectar reativação: já respondemos antes, mas última mensagem foi há mais de 24h
    const agora = new Date()
    const ultimaMensagemEm = conversa.ultima_mensagem_em ? new Date(conversa.ultima_mensagem_em) : null
    const horasDecorridas = ultimaMensagemEm
      ? (agora.getTime() - ultimaMensagemEm.getTime()) / (1000 * 60 * 60)
      : 0
    const ehReativacao = jaRespondeu && horasDecorridas > 24

    // LYNEDES-103 Sprint 2: detectar lead que retornou de um ciclo anterior
    const ehRetorno = Boolean(conversa.eh_retorno)
    const cicloAtual = conversa.ciclo_atual || 1

    const statusConversa = ehRetorno
      ? "RETORNO_NOVO_CICLO"
      : !jaRespondeu
        ? "PRIMEIRA_RESPOSTA"
        : ehReativacao
          ? "REATIVACAO"
          : "EM_ANDAMENTO"

    const infoRetorno = ehRetorno
      ? `\n- ATENÇÃO: lead RETORNANDO (ciclo ${cicloAtual}). NÃO se reapresente. Cumprimente como quem reconhece: "Que bom ter você de volta${nomeCliente ? `, ${nomeCliente}` : ""}! Como posso ajudar dessa vez?"`
      : ""

    let contextoExtra = `\n\nCONTEXTO DA CONVERSA:${nomeVerificado}
- Número WhatsApp: ${conversa.numero_cliente}
- Status da conversa: ${statusConversa}${infoRetorno}`

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

    // Se há imóvel de interesse (lead de portal/site com imóvel específico), buscar TODOS os dados
    if (conversa.imovel_interesse_id) {
      const { data: imovelInteresse } = await supabase
        .from("imoveis")
        .select("id, titulo, codigo_interno, tipo, finalidade, status, descricao, logradouro, numero, bairro, cidade, estado, cep, valor, valor_aluguel, valor_condominio, valor_iptu, quartos, suites, banheiros, vagas, area_total, area_construida")
        .eq("id", conversa.imovel_interesse_id as string)
        .single()

      if (imovelInteresse) {
        const i = imovelInteresse
        const preco = i.valor
          ? `R$ ${Number(i.valor).toLocaleString("pt-BR")}`
          : i.valor_aluguel
            ? `R$ ${Number(i.valor_aluguel).toLocaleString("pt-BR")}/mês`
            : "preço sob consulta"
        const { linhasComodosFicha } = await import("./formatador-imovel")
        const partesFicha = [
          `- ID: ${i.id}`,
          `- Título: ${i.titulo}`,
          i.codigo_interno ? `- Código interno: ${i.codigo_interno}` : null,
          `- Tipo: ${i.tipo} | Finalidade: ${i.finalidade}`,
          `- Endereço: ${[i.logradouro, i.numero, i.bairro, i.cidade, i.estado].filter(Boolean).join(", ")}`,
          `- Preço: ${preco}${i.valor_condominio ? ` | Condomínio: R$ ${Number(i.valor_condominio).toLocaleString("pt-BR")}/mês` : ""}${i.valor_iptu ? ` | IPTU: R$ ${Number(i.valor_iptu).toLocaleString("pt-BR")}/ano` : ""}`,
          // Cômodos só quando > 0 e NUNCA para terreno/lote (fonte única — formatador-imovel.ts)
          ...linhasComodosFicha(i).map((l) => `- ${l}`),
          i.area_total ? `- Área total: ${i.area_total}m²` : null,
          i.area_construida ? `- Área construída: ${i.area_construida}m²` : null,
          i.descricao ? `- Descrição: ${i.descricao}` : null,
        ].filter(Boolean)
        contextoExtra += `\n\nDETALHES COMPLETOS DO IMÓVEL DE INTERESSE:\n${partesFicha.join("\n")}\nVocê tem TODAS as informações deste imóvel. Responda qualquer pergunta do cliente sobre ele sem precisar chamar ferramentas.`
      }
    }

    // 8. Identificar mensagens novas (não na memória)
    const mensagensNovas = identificarMensagensNovas(
      mensagensOrdenadas,
      memoriaExistente.length
    )

    // Montar messages array no formato Anthropic
    // System prompt vai SEPARADO (não em messages[])
    const messages: Anthropic.MessageParam[] = []

    // Adicionar memória (histórico anterior) — pares user/assistant
    for (const msg of memoriaExistente) {
      messages.push({
        role: msg.papel === "usuario" ? "user" : "assistant",
        content: msg.conteudo,
      })
    }

    // Adicionar mensagens novas (do lote do debounce)
    for (const msg of mensagensNovas) {
      if (msg.direcao === "recebida") {
        // O conteudo já vem processado pelo debounce (Whisper, Vision, pdf-parse)
        const conteudo = msg.conteudo?.trim()
        let conteudoFormatado: string

        if (msg.tipo_conteudo === "audio") {
          conteudoFormatado = conteudo
            ? `[mensagem de voz do cliente]: ${conteudo}`
            : "[cliente enviou áudio que não foi possível transcrever]"
        } else if (msg.tipo_conteudo === "imagem") {
          conteudoFormatado = conteudo || "[cliente enviou uma imagem]"
        } else if (msg.tipo_conteudo === "documento") {
          conteudoFormatado = conteudo || "[cliente enviou um documento]"
        } else if (msg.tipo_conteudo === "video") {
          conteudoFormatado = conteudo || "[cliente enviou um vídeo]"
        } else if (msg.tipo_conteudo === "sticker") {
          conteudoFormatado = "[cliente enviou um sticker]"
        } else {
          conteudoFormatado = conteudo || "[mensagem sem conteúdo]"
        }
        messages.push({ role: "user", content: conteudoFormatado })
      }
    }

    // Anthropic exige que a primeira mensagem seja "user". Se a memória
    // começa com assistant (acontece em casos raros), removemos até bater.
    while (messages.length > 0 && messages[0].role !== "user") {
      messages.shift()
    }

    if (messages.length === 0) {
      console.log(`[Agente SDR] IA NÃO RESPONDEU — Conversa ${conversaId}: nenhuma mensagem nova do usuário para processar`)
      return
    }

    // 9. Escolher modelo Claude (Haiku padrão, Sonnet quando complexo)
    const { getAnthropic, escolherModelo, detectarFluxoComplexo } = await import("@/lib/anthropic")

    const textosUltimasUser = messages
      .filter((m) => m.role === "user" && typeof m.content === "string")
      .slice(-3)
      .map((m) => m.content as string)

    const ultimaMsgRecebida = mensagensNovas[mensagensNovas.length - 1]
    const modelo = escolherModelo({
      numTurnos: messages.length,
      ultimaMensagemTemImagem: ultimaMsgRecebida?.tipo_conteudo === "imagem",
      toolErrouAntes: false,
      fluxoComplexo: detectarFluxoComplexo(textosUltimasUser),
    })

    console.log(`[Agente SDR] Conversa ${conversaId}: usando modelo ${modelo}`)

    // 10. Loop agentic Anthropic com tools
    const { definicaoToolsSdr, executarTool } = await import("./tools-sdr")

    const contextoTool = {
      conversaId,
      organizacaoId,
      numeroCliente: conversa.numero_cliente,
      clienteId: conversa.cliente_id ?? null,
      negocioId: conversa.negocio_id ?? null,
    }

    let respostaFinal: string | null = null
    const anthropic = getAnthropic()

    for (let iteracao = 0; iteracao < MAX_ITERACOES_TOOLS + 1; iteracao++) {
      const resposta = await anthropic.messages.create({
        model: modelo,
        max_tokens: 1024,
        // Temperatura moderada-baixa: respostas factuais (preço, área, imóvel) ficam
        // mais consistentes e o agente improvisa menos "resposta aleatória".
        temperature: 0.5,
        system: systemPrompt + contextoExtra,
        tools: definicaoToolsSdr,
        messages,
      })

      // Coletar tool_use blocks da resposta
      const blocosTexto: string[] = []
      const blocosToolUse: Array<{ id: string; name: string; input: Record<string, unknown> }> = []

      for (const bloco of resposta.content) {
        if (bloco.type === "text") {
          blocosTexto.push(bloco.text)
        } else if (bloco.type === "tool_use") {
          blocosToolUse.push({
            id: bloco.id,
            name: bloco.name,
            input: bloco.input as Record<string, unknown>,
          })
        }
      }

      // Se a IA quer chamar tools
      if (blocosToolUse.length > 0 && iteracao < MAX_ITERACOES_TOOLS) {
        // Anexar mensagem da assistente completa (preserva blocos tool_use)
        messages.push({ role: "assistant", content: resposta.content })

        // Executar cada tool e montar bloco user com tool_result
        const blocosToolResult: Anthropic.ToolResultBlockParam[] = []
        for (const tu of blocosToolUse) {
          try {
            const resultado = await executarTool(tu.name, tu.input, contextoTool)
            blocosToolResult.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: resultado,
            })
          } catch (erro) {
            console.error(`[Agente SDR] Erro na tool ${tu.name}:`, erro)
            blocosToolResult.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: `Erro ao executar ${tu.name}. Tente outra abordagem.`,
              is_error: true,
            })
          }
        }

        messages.push({ role: "user", content: blocosToolResult })
        continue
      }

      // Resposta final (sem tool_use ou iteração máxima)
      respostaFinal = blocosTexto.join("\n").trim() || null
      break
    }

    if (!respostaFinal) {
      console.error(`[Agente SDR] IA NÃO RESPONDEU — Claude retornou resposta vazia para conversa ${conversaId}`)
      return
    }

    // 10. Enviar resposta humanizada citando a última mensagem do cliente
    // (efeito "responder" do WhatsApp aparece em cima da resposta)
    const ultimaMsgClienteId = [...mensagensNovas]
      .reverse()
      .find((m) => m.direcao === "recebida" && m.message_id_whatsapp)
      ?.message_id_whatsapp
    const { enviarHumanizado } = await import("./humanizar")
    await enviarHumanizado(configTyped, conversa.numero_cliente, respostaFinal, {
      ...(ultimaMsgClienteId ? { replyid: ultimaMsgClienteId } : {}),
    })

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
    message_id_whatsapp?: string | null
  }>,
  tamanhoMemoria: number
): Array<{
  direcao: string
  conteudo: string | null
  tipo_conteudo: string
  criado_em: string
  message_id_whatsapp?: string | null
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
