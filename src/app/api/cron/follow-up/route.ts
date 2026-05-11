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

      // Validar que a ultima mensagem foi enviada pela IA (nao do lead)
      const { data: ultimaMsg } = await supabase
        .from("mensagens_whatsapp")
        .select("direcao")
        .eq("conversa_id", conversa.id)
        .order("criado_em", { ascending: false })
        .limit(1)
        .single()

      if (!ultimaMsg || ultimaMsg.direcao !== "enviada") {
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

      // Gerar follow-up simples e enviar humanizado
      const nome = conversa.nome_cliente?.split(" ")[0] || ""
      const saudacao = nome ? `Oi ${nome}` : "Oi"
      const mensagem = `${saudacao}, tudo bem? Vi que estavamos conversando por aqui. Posso te ajudar com mais alguma coisa?`

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
