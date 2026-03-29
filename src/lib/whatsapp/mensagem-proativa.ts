import type { ConfigWhatsapp, HorarioAtendimento } from "@/types/whatsapp"
import { buscarOuCriarConversa, criarClienteENegocioInicial, normalizarTelefoneWhatsApp } from "./conversa-utils"

// ============================================================
// Mensagem proativa para leads de portal
// Quando um lead chega do portal com telefone, a IA toma a
// iniciativa e manda a primeira mensagem mencionando o imóvel
// ============================================================

type DadosProativo = {
  organizacaoId: string
  telefone: string
  nomeCliente?: string | null
  imovelId?: string | null
  leadId: string
  portal: string
}

/**
 * Envia mensagem proativa via WhatsApp quando um lead de portal chega.
 * Cria conversa, cliente, negócio e envia saudação personalizada pela IA.
 */
export async function enviarMensagemProativaPortal(dados: DadosProativo): Promise<void> {
  const { organizacaoId, telefone, nomeCliente, imovelId, leadId, portal } = dados

  try {
    const { criarClienteAdmin } = await import("@/lib/supabase/admin")
    const supabase = criarClienteAdmin()

    // 1. Buscar config WhatsApp da org — se não ativo, parar silenciosamente
    const { data: config } = await supabase
      .from("config_whatsapp")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .eq("ativo", true)
      .single()

    if (!config) {
      console.log(`[Proativo] Org ${organizacaoId} sem WhatsApp ativo — lead ${leadId} salvo sem mensagem`)
      return
    }

    const configTyped = config as unknown as ConfigWhatsapp

    // 2. Verificar horário de atendimento
    if (configTyped.horario_atendimento) {
      if (verificarForaHorario(configTyped.horario_atendimento)) {
        console.log(`[Proativo] Fora do horário de atendimento — lead ${leadId} salvo sem mensagem`)
        return
      }
    }

    // 3. Normalizar telefone para formato WhatsApp
    const numeroWhatsApp = normalizarTelefoneWhatsApp(telefone)

    // 4. Buscar ou criar conversa
    const { id: conversaId, isNova } = await buscarOuCriarConversa(
      supabase,
      organizacaoId,
      numeroWhatsApp,
      nomeCliente || null
    )

    // Se conversa já existia, não enviar mensagem proativa (cliente já está em atendimento)
    if (!isNova) {
      console.log(`[Proativo] Conversa já existe para ${numeroWhatsApp} — lead ${leadId} vinculado sem nova mensagem`)
      return
    }

    // 5. Criar cliente e negócio
    const origemLead = portal === "site" ? "site" as const : "portal" as const
    const resultado = await criarClienteENegocioInicial(
      supabase,
      organizacaoId,
      numeroWhatsApp,
      conversaId,
      config,
      {
        nomeCliente: nomeCliente || undefined,
        origemLead,
        imovelInteresseId: imovelId || undefined,
      }
    )

    // 6. Buscar dados do imóvel (se houver)
    let infoImovel = ""
    if (imovelId) {
      const { data: imovel } = await supabase
        .from("imoveis")
        .select("titulo, tipo, bairro, cidade, valor, valor_aluguel")
        .eq("id", imovelId)
        .single()

      if (imovel) {
        const preco = imovel.valor
          ? `R$ ${Number(imovel.valor).toLocaleString("pt-BR")}`
          : imovel.valor_aluguel
            ? `R$ ${Number(imovel.valor_aluguel).toLocaleString("pt-BR")}/mês`
            : "preço sob consulta"
        infoImovel = `${imovel.titulo} | ${imovel.tipo} | ${imovel.bairro}${imovel.cidade ? `, ${imovel.cidade}` : ""} | ${preco}`
      }
    }

    // 7. Buscar nome da organização
    const { data: org } = await supabase
      .from("organizacoes")
      .select("nome")
      .eq("id", organizacaoId)
      .single()

    const nomeOrganizacao = org?.nome || "Imobiliária"

    // 8. Gerar mensagem proativa com IA
    const { montarPromptSdr } = await import("./prompt-sdr")
    const systemPrompt = montarPromptSdr(configTyped, nomeOrganizacao)

    const contextoExtra = `

CONTEXTO DA CONVERSA:
- Número WhatsApp: ${numeroWhatsApp}
- Status da conversa: PRIMEIRA_RESPOSTA
- Canal de origem: ${origemLead.toUpperCase()}${infoImovel ? `\n- Imóvel de interesse: ${infoImovel}` : ""}

INSTRUÇÃO ESPECIAL: Este é um envio proativo. O cliente acabou de demonstrar interesse num portal imobiliário (${portal}). Envie a PRIMEIRA mensagem de apresentação. Seja simpático, mencione o imóvel${infoImovel ? "" : " se souber"} e pergunte se ainda tem interesse ou se quer agendar uma visita. Mensagem curta e natural.`

    const { getOpenAI } = await import("@/lib/openai")
    const resposta = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt + contextoExtra },
        {
          role: "user",
          content: "[SISTEMA: Lead de portal acabou de chegar. Envie a primeira mensagem de apresentação ao cliente.]",
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const mensagemGerada = resposta.choices[0]?.message?.content?.trim()
    if (!mensagemGerada) {
      console.error(`[Proativo] IA não retornou mensagem para lead ${leadId}`)
      return
    }

    // 9. Enviar via WhatsApp
    const { enviarHumanizado } = await import("./humanizar")
    await enviarHumanizado(configTyped, numeroWhatsApp, mensagemGerada)

    // 10. Salvar mensagem no banco
    await supabase
      .from("mensagens_whatsapp")
      .insert({
        conversa_id: conversaId,
        organizacao_id: organizacaoId,
        direcao: "enviada",
        tipo_conteudo: "texto",
        conteudo: mensagemGerada,
        conteudo_original: mensagemGerada,
      })

    // Atualizar timestamp da conversa
    await supabase
      .from("conversas_whatsapp")
      .update({ ultima_mensagem_em: new Date().toISOString() })
      .eq("id", conversaId)

    // 11. Salvar na memória Redis
    const { salvarMensagemMemoria } = await import("./memoria")
    await salvarMensagemMemoria(conversaId, "assistente", mensagemGerada)

    // 12. Atualizar lead como processado
    await supabase
      .from("leads_portais")
      .update({
        status: "processado",
        processado_em: new Date().toISOString(),
        ...(resultado ? { cliente_id: resultado.clienteId, negocio_id: resultado.negocioId } : {}),
      })
      .eq("id", leadId)

    console.log(`[Proativo] Mensagem enviada para ${numeroWhatsApp} (lead ${leadId}, org ${organizacaoId})`)
  } catch (erro) {
    console.error(
      `[Proativo] Erro ao enviar mensagem proativa para lead ${leadId}:`,
      erro instanceof Error ? `${erro.message}\n${erro.stack}` : erro
    )
  }
}

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

  if (!configuracaoDia) return true

  const horaAtual = `${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}`

  return horaAtual < configuracaoDia.inicio || horaAtual > configuracaoDia.fim
}
