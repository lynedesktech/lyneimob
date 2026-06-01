import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import type { ConfigWhatsapp } from "@/types/whatsapp"

// ============================================================
// LYNEDES-103 Sprint 2 — Follow-up automatico
// Cron a cada 1h durante horario comercial (Vercel)
// Busca conversas em_andamento/qualificado com ultima msg do lead > 2h
// Gera follow-up contextual via IA
// Limite: 1 follow-up por conversa por dia (flag Redis)
// NAO faz follow-up em "encaminhado" (corretor assume)
// ============================================================

export const maxDuration = 60

const HORAS_SEM_RESPOSTA = 2
const HORA_INICIO = 8 // horario comercial (-3 BRT)
const HORA_FIM = 18

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 })
  }

  // Limitar ao horario comercial (-3 BRT)
  const horaBR = new Date().toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  })
  const horaAtual = parseInt(horaBR, 10)
  if (horaAtual < HORA_INICIO || horaAtual >= HORA_FIM) {
    return NextResponse.json({ status: "fora_horario", hora: horaAtual })
  }

  const supabase = criarClienteAdmin()
  const limiteIso = new Date(Date.now() - HORAS_SEM_RESPOSTA * 60 * 60 * 1000).toISOString()

  // Buscar conversas em andamento sem resposta do lead ha 2h+
  // Tem que ter ultima mensagem ENVIADA pela IA (esperando lead responder)
  const { data: conversas, error: erroBusca } = await supabase
    .from("conversas_whatsapp")
    .select("id, organizacao_id, numero_cliente, nome_cliente, status, ultima_mensagem_em")
    .in("status", ["em_andamento", "qualificado"])
    .lt("ultima_mensagem_em", limiteIso)

  if (erroBusca) {
    console.error("[cron/follow-up] Erro ao buscar conversas:", erroBusca.message)
    return NextResponse.json({ erro: "Erro ao buscar conversas" }, { status: 500 })
  }

  if (!conversas || conversas.length === 0) {
    return NextResponse.json({ status: "ok", enviados: 0 })
  }

  const { redis } = await import("@/lib/redis")
  const MAX_FOLLOWUPS_POR_CONVERSA = 3
  let enviados = 0
  let pulados = 0
  let bloqueados_limite = 0

  for (const conversa of conversas) {
    try {
      // Anti-spam: limite total de follow-ups por conversa (sem resposta do lead = para)
      if (redis) {
        const chaveDia = `followup:${conversa.id}:${new Date().toISOString().slice(0, 10)}`
        const jaEnviado = await redis.get(chaveDia)
        if (jaEnviado) {
          pulados++
          continue
        }

        const chaveContador = `followup:count:${conversa.id}`
        const totalEnviados = parseInt((await redis.get(chaveContador)) as string || "0", 10)
        if (totalEnviados >= MAX_FOLLOWUPS_POR_CONVERSA) {
          bloqueados_limite++
          continue
        }
      }

      // Buscar ultimas 15 msgs pra contexto + validar que ultima foi da IA
      const { data: msgsHistorico } = await supabase
        .from("mensagens_whatsapp")
        .select("direcao, tipo_conteudo, conteudo, criado_em")
        .eq("conversa_id", conversa.id)
        .order("criado_em", { ascending: false })
        .limit(15)

      if (!msgsHistorico || msgsHistorico.length === 0) {
        pulados++
        continue
      }

      // Se a ultima msg foi do CLIENTE, ele voltou a responder — zera contador de follow-ups
      if (msgsHistorico[0].direcao !== "enviada") {
        if (redis) {
          await redis.del(`followup:count:${conversa.id}`)
        }
        pulados++
        continue
      }

      // Buscar config WhatsApp da org
      const { data: config } = await supabase
        .from("config_whatsapp")
        .select("*")
        .eq("organizacao_id", conversa.organizacao_id)
        .eq("ativo", true)
        .single()

      if (!config) {
        pulados++
        continue
      }

      // Buscar nome da org pra contexto da IA
      const { data: org } = await supabase
        .from("organizacoes")
        .select("nome")
        .eq("id", conversa.organizacao_id)
        .single()

      const nomeOrg = org?.nome || "Imobiliaria"
      const configTyped = config as unknown as ConfigWhatsapp
      const nomeAgente = configTyped.nome_agente || `Assistente ${nomeOrg}`
      const nomeCliente = conversa.nome_cliente?.split(" ")[0] || ""

      // Montar historico cronologico pra Claude
      const historico = msgsHistorico
        .reverse()
        .map((m) => {
          const quem = m.direcao === "enviada" ? "Voce" : (nomeCliente || "Cliente")
          const txt = (m.conteudo || "").slice(0, 300)
          return `${quem}: ${txt}`
        })
        .join("\n")

      // Buscar follow-ups anteriores enviados nessa conversa pra NAO repetir padrao
      const { data: followupsAnteriores } = await supabase
        .from("mensagens_whatsapp")
        .select("conteudo")
        .eq("conversa_id", conversa.id)
        .eq("direcao", "enviada")
        .order("criado_em", { ascending: false })
        .limit(5)
      const ultimosTextos =
        followupsAnteriores
          ?.map((m) => (m.conteudo || "").slice(0, 200))
          .filter(Boolean) || []

      // Angulos rotativos pra variar follow-up — escolha pseudoaleatoria por dia + conversa
      const ANGULOS = [
        "Comente brevemente algo positivo sobre a Praia da Taiba ou Caucaia que combine com o perfil dele, e termine com pergunta leve sobre preferencia (regiao, tipo).",
        "Pergunta direta e leve sobre o que ele esta priorizando agora (regiao, valor, tipo de imovel) — sem pressao.",
        "Comentario curto reconhecendo que decisao de imovel leva tempo, oferecendo ajuda pra esclarecer duvida especifica.",
        "Provocacao gentil de curiosidade: mencione que tem opcao nova/interessante e pergunte se ele quer dar uma olhada.",
        "Pergunta sobre prazo/momento dele (esta procurando pra agora, pros proximos meses?) — ajuda a calibrar.",
        "Comentario humano sobre a regiao (clima, valorizacao, ou momento do mercado) puxando opiniao dele.",
        "Retomada simples do ultimo assunto da conversa (cite algo especifico que foi mencionado).",
        "Mensagem curta de presenca: mostra que voce esta disponivel sem cobrar resposta. Pergunta opcional no fim.",
      ]
      // Hash determinista do conversa.id + dia pra escolher angulo (evita repetir mesmo angulo no mesmo dia)
      const hoje = new Date().toISOString().slice(0, 10)
      const semente = `${conversa.id}-${hoje}`
      let hash = 0
      for (let i = 0; i < semente.length; i++) {
        hash = (hash * 31 + semente.charCodeAt(i)) | 0
      }
      const anguloEscolhido = ANGULOS[Math.abs(hash) % ANGULOS.length]

      // Gerar mensagem de re-engajamento contextual com Claude Haiku
      let mensagem = ""
      try {
        const { getAnthropic } = await import("@/lib/anthropic")
        const sys = `Voce e ${nomeAgente}, atendente humana da imobiliaria ${nomeOrg}, mulher cearense de Fortaleza, calorosa e profissional.

REGRA DE TRATAMENTO INEGOCIAVEL: SEMPRE use "voce". NUNCA "tu", "ti", "teu", "tua". Cliente alto padrao da ${nomeOrg} espera respeito.

Sua tarefa AGORA: gerar UMA UNICA mensagem de re-engajamento (follow-up) pra cliente que parou de responder ha algumas horas.

ANGULO DESSA MENSAGEM (siga ele): ${anguloEscolhido}

Regras de escrita:
- Maximo 2 linhas curtas estilo WhatsApp. Sem textao.
- ${nomeCliente ? `Pode usar o nome "${nomeCliente}" no inicio se ficar natural — NAO obrigatorio.` : "Nao use nome, voce ainda nao sabe."}
- NUNCA comece com "Claro!", "Otimo!", "Perfeito!", "Olha so" (esses ja foram usados).
- NUNCA escreva "vi que paramos", "notei que voce sumiu", "estava pensando em voce", "passei pra saber" — soam falsas.
- NUNCA force venda. Conversa genuina, nao cobranca.
- Sem emojis (cliente alto padrao acha esquisito).
- Sem travessao (—). Use ponto ou virgula.

CRITICO — EVITAR REPETICAO:
Voce JA mandou essas mensagens recentes nessa conversa. NAO repita expressoes, aberturas nem estrutura delas:
${ultimosTextos.length > 0 ? ultimosTextos.map((t, i) => `${i + 1}. "${t}"`).join("\n") : "(nenhuma mensagem anterior registrada)"}

Se a ultima mensagem ja foi um follow-up, varia COMPLETAMENTE: aborde outro angulo, use outras palavras, mude o tom.

Responda APENAS com o texto da mensagem. Sem prefixo, sem aspas, sem markdown.`

        const userPrompt = `Historico das ultimas conversas com ${nomeCliente || "o cliente"}:

${historico}

Gere agora a mensagem de re-engajamento seguindo o angulo definido. Lembre: SEMPRE "voce", nunca repetir as mensagens anteriores listadas.`

        const resposta = await getAnthropic().messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 200,
          system: sys,
          messages: [{ role: "user", content: userPrompt }],
        })
        const bloco = resposta.content.find((b) => b.type === "text")
        if (bloco && bloco.type === "text") {
          mensagem = bloco.text.trim().replace(/^["']|["']$/g, "")
        }
      } catch (erroIa) {
        console.error(
          `[Follow-up] Erro gerando texto via Claude para conversa ${conversa.id}:`,
          erroIa instanceof Error ? erroIa.message : erroIa
        )
      }

      // Fallback se a IA falhou: pool de variacoes (escolhido pelo hash do dia+conversa)
      if (!mensagem) {
        const nomePrefix = nomeCliente ? `${nomeCliente}, ` : ""
        const FALLBACKS = [
          `${nomePrefix}consegui pensar em algumas opcoes que podem combinar com voce. Quer dar uma olhada?`,
          `${nomeCliente ? `Oi ${nomeCliente}!` : "Oi!"} Como esta o seu dia? Posso te ajudar com algo nesse momento?`,
          `${nomePrefix}lembrei de voce hoje. Continua interessado em conhecer opcoes na Taiba ou Caucaia?`,
          `${nomePrefix}fica a vontade pra retomar quando puder. Estou por aqui se quiser tirar alguma duvida.`,
          `${nomeCliente ? `${nomeCliente}, ` : ""}qual seria o melhor momento pra gente conversar sobre o imovel?`,
          `${nomePrefix}voce ja teve a chance de pensar no que falamos? Posso te ajudar a destrinchar alguma parte?`,
        ]
        mensagem = FALLBACKS[Math.abs(hash) % FALLBACKS.length]
      }

      const { enviarHumanizado } = await import("@/lib/whatsapp/humanizar")
      await enviarHumanizado(config as unknown as ConfigWhatsapp, conversa.numero_cliente, mensagem)

      // Salvar mensagem no banco
      await supabase.from("mensagens_whatsapp").insert({
        conversa_id: conversa.id,
        organizacao_id: conversa.organizacao_id,
        direcao: "enviada",
        tipo_conteudo: "texto",
        conteudo: mensagem,
        conteudo_original: mensagem,
      })

      // Atualizar timestamp da conversa
      await supabase
        .from("conversas_whatsapp")
        .update({ ultima_mensagem_em: new Date().toISOString() })
        .eq("id", conversa.id)

      // Registrar envio: trava do dia + incrementar contador total
      if (redis) {
        const chaveDia = `followup:${conversa.id}:${new Date().toISOString().slice(0, 10)}`
        await redis.set(chaveDia, "1", { ex: 60 * 60 * 24 })
        const chaveContador = `followup:count:${conversa.id}`
        await redis.incr(chaveContador)
        await redis.expire(chaveContador, 60 * 60 * 24 * 60) // 60 dias
      }

      enviados++
      console.log(
        `[Follow-up] Enviado para ${conversa.numero_cliente} (org ${conversa.organizacao_id}, conversa ${conversa.id})`
      )
    } catch (erro) {
      console.error(
        `[Follow-up] Erro ao enviar para conversa ${conversa.id}:`,
        erro instanceof Error ? erro.message : erro
      )
    }
  }

  return NextResponse.json({
    status: "ok",
    enviados,
    pulados,
    bloqueados_limite,
    total_avaliadas: conversas.length,
  })
}
