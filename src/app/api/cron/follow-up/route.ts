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
  let enviados = 0
  let pulados = 0

  for (const conversa of conversas) {
    try {
      // Limite: 1 follow-up por conversa por dia
      if (redis) {
        const chaveDia = `followup:${conversa.id}:${new Date().toISOString().slice(0, 10)}`
        const jaEnviado = await redis.get(chaveDia)
        if (jaEnviado) {
          pulados++
          continue
        }
        // TTL ate o fim do dia
        await redis.set(chaveDia, "1", { ex: 60 * 60 * 24 })
      }

      // Buscar ultimas 15 msgs pra contexto + validar que ultima foi da IA
      const { data: msgsHistorico } = await supabase
        .from("mensagens_whatsapp")
        .select("direcao, tipo_conteudo, conteudo, criado_em")
        .eq("conversa_id", conversa.id)
        .order("criado_em", { ascending: false })
        .limit(15)

      if (!msgsHistorico || msgsHistorico.length === 0 || msgsHistorico[0].direcao !== "enviada") {
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

      // Gerar mensagem de re-engajamento contextual com Claude Haiku
      let mensagem = ""
      try {
        const { getAnthropic } = await import("@/lib/anthropic")
        const sys = `Voce e ${nomeAgente}, atendente humana cearense da imobiliaria ${nomeOrg}.
Mulher, calorosa, fala "tu" e "voce" misturando, usa expressoes como "olha so", "show", "belezinha", "tô aqui pra te ajudar".

Sua tarefa AGORA: gerar uma UNICA mensagem curta e natural pra re-engajar o cliente que parou de responder ha algumas horas.

Regras:
- Maximo 2 linhas curtas no WhatsApp. Nao escreva textao.
- Retome o assunto que voces estavam conversando (use o historico abaixo).
- NUNCA force venda. So puxa conversa, mostra interesse genuino.
- ${nomeCliente ? `Use o nome "${nomeCliente}" UMA vez se fizer sentido natural.` : "Nao use nome, voce ainda nao sabe."}
- NUNCA comece com "Claro!", "Otimo!", "Perfeito!".
- Nao fale "vi que paramos", "notei que voce nao respondeu", "estava aqui pensando em voce". Soa esquisito.
- Tente puxar uma resposta facil: pergunta curta ou comentario que convide a responder.
- Variar formato: as vezes pergunta, as vezes comentario, as vezes ambos.

Responda APENAS com o texto da mensagem. Sem prefixo, sem aspas, sem markdown.`

        const userPrompt = `Historico das ultimas conversas com ${nomeCliente || "o cliente"}:

${historico}

Gere agora uma mensagem curta de re-engajamento.`

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

      // Fallback se a IA falhou
      if (!mensagem) {
        const sauda = nomeCliente ? `Oi ${nomeCliente}` : "Oi"
        mensagem = `${sauda}, tudo certo por ai? Tô aqui se precisar de mais alguma coisa.`
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
    total_avaliadas: conversas.length,
  })
}
