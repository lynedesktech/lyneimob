import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import type { ConfigWhatsapp } from "@/types/whatsapp"

// ============================================================
// LYNEDES-103 Sprint 2 — Follow-up automatico
// Cron rodado seg/qua/sex nas "golden hours" da Duna:
//   - Almoco: 12h-13h59 BRT
//   - Inicio da noite: 18h-19h59 BRT
// IMPORTANTE: os crons da Vercel rodam em UTC. Por isso o schedule no
// vercel.json esta em UTC ("0 15,16,21,22 * * 1,3,5"), que corresponde a
// 12h, 13h, 18h e 19h em Brasilia (UTC-3). A validacao JANELAS_VALIDAS
// abaixo confere o horario ja convertido pra Sao Paulo.
// Busca conversas em_andamento/qualificado com ultima msg do lead > 2h
// Gera follow-up contextual via IA
// Limite total: 6 follow-ups por conversa (cobre ~2 semanas de cadencia 3x/sem)
// NAO faz follow-up em "encaminhado" (corretor assume)
// ============================================================

export const maxDuration = 60

const HORAS_SEM_RESPOSTA = 2
// Janelas validas em horario de Sao Paulo (-3 BRT)
// Defesa em profundidade: o cron Vercel ja agenda nesses horarios,
// mas se for chamado fora deles (manual, teste), ignora.
const JANELAS_VALIDAS = [
  { inicio: 12, fim: 14 }, // 12h-13h59 -> golden hour do almoco
  { inicio: 18, fim: 20 }, // 18h-19h59 -> golden hour da noite
]
// Dias da semana validos (0=domingo, 1=segunda, ..., 6=sabado)
const DIAS_VALIDOS = [1, 3, 5] // seg, qua, sex

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 })
  }

  // Defesa em profundidade: validar dia da semana + janela horaria (golden hours)
  const agoraBR = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  )
  const diaSemana = agoraBR.getDay()
  const horaAtual = agoraBR.getHours()
  if (!DIAS_VALIDOS.includes(diaSemana)) {
    return NextResponse.json({ status: "fora_dia", dia_semana: diaSemana })
  }
  const dentroJanela = JANELAS_VALIDAS.some(
    (j) => horaAtual >= j.inicio && horaAtual < j.fim
  )
  if (!dentroJanela) {
    return NextResponse.json({ status: "fora_janela", hora: horaAtual })
  }

  // Respeita o desligamento global da IA (mesmo gate do agente ao vivo).
  // Se a IA esta desligada, nao envia follow-up de jeito nenhum.
  const { isIAGlobalEnabled, isContactBlocked } = await import("@/lib/whatsapp/ia-toggle")
  if (!(await isIAGlobalEnabled())) {
    return NextResponse.json({ status: "ia_desativada" })
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
  // 6 = ~2 semanas de cadencia 3x/semana antes de desistir do lead
  const MAX_FOLLOWUPS_POR_CONVERSA = 6
  let enviados = 0
  let pulados = 0
  let bloqueados_limite = 0

  for (const conversa of conversas) {
    try {
      // Pula contatos onde um humano assumiu manualmente (bloqueio de 30 dias).
      // Evita a IA mandar follow-up por cima do corretor.
      if (await isContactBlocked(conversa.numero_cliente, conversa.organizacao_id)) {
        pulados++
        continue
      }

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
      const { extrairPrimeiroNomeValido } = await import("@/lib/whatsapp/nome-contato")
      const nomeCliente = extrairPrimeiroNomeValido(conversa.nome_cliente) || ""

      // Montar historico cronologico pra Claude
      const historico = msgsHistorico
        .reverse()
        .map((m) => {
          const quem = m.direcao === "enviada" ? "Voce" : (nomeCliente || "Cliente")
          const txt = (m.conteudo || "").slice(0, 300)
          return `${quem}: ${txt}`
        })
        .join("\n")

      // FREIO: nao fazer follow-up de quem NAO e lead comprador.
      // Ex: cliente disse que nao quer comprar, quer VENDER um imovel, se despediu
      // ou encerrou. A IA classifica; se "PARAR", encerra a conversa (status
      // finalizado) pra nunca mais entrar no follow-up.
      try {
        const { getAnthropic } = await import("@/lib/anthropic")
        const classif = await getAnthropic().messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 6,
          system: `Voce decide se vale CONTINUAR fazendo follow-up com um lead de imobiliaria. Responda APENAS uma palavra: PARAR ou SEGUIR.
Responda PARAR se, no historico, o cliente: disse que NAO quer comprar; quer VENDER um imovel dele (nao comprar); se despediu ou encerrou a conversa ("obrigada, era so isso", "voce e um amor, obrigado pela atencao"); disse que nao tem interesse; pediu pra parar; ou claramente NAO e um lead comprador.
Responda SEGUIR se e um comprador em potencial que apenas parou de responder e ainda pode fechar negocio.`,
          messages: [{ role: "user", content: `Historico:\n${historico}` }],
        })
        const blocoClassif = classif.content.find((b) => b.type === "text")
        const veredito = blocoClassif && blocoClassif.type === "text" ? blocoClassif.text.toUpperCase() : ""
        if (veredito.includes("PARAR")) {
          await supabase
            .from("conversas_whatsapp")
            .update({ status: "finalizado" })
            .eq("id", conversa.id)
          pulados++
          console.log(`[Follow-up] PARAR: conversa ${conversa.id} encerrada (lead nao-comprador/encerrou)`)
          continue
        }
      } catch (erroClassif) {
        // Se a classificacao falhar, NAO bloqueia o follow-up (segue o fluxo normal).
        console.error(
          `[Follow-up] Erro na classificacao da conversa ${conversa.id}:`,
          erroClassif instanceof Error ? erroClassif.message : erroClassif
        )
      }

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

      // Angulos rotativos pra variar follow-up (12 opcoes) — escolha pseudoaleatoria por dia + conversa
      // Angelo (Duna) pediu: continuar de onde parou + estimular o cliente (visita, info nova)
      // NUNCA usar variacoes de "to aqui se precisar" — soa robotico e repetitivo.
      const ANGULOS = [
        "RETOMADA: cite algo ESPECIFICO da ultima troca (um imovel mencionado, uma duvida levantada, uma preferencia falada) e pergunte se ele teve chance de pensar.",
        "ESTIMULO POR VISITA: convide pra visitar fisicamente o imovel ou regiao. Ex: 'Quer que eu organize uma visita pra voce conhecer pessoalmente?'",
        "ESTIMULO POR INFO NOVA: traga uma curiosidade ou dado novo da regiao/mercado que possa interessar (sem inventar valor especifico). Ex: 'Apareceu uma novidade aqui que talvez te interesse...'",
        "ENTENDIMENTO DA DOR: pergunta inteligente sobre o motivo da busca (necessidade, emocao, investimento, mudanca de vida) — sem soar entrevista.",
        "PERGUNTA DE PRIORIDADE: o que esta pesando mais agora na decisao (valor? regiao? prazo? metragem?).",
        "ABERTURA DE DUVIDA: se algum ponto ficou nebuloso, oferece esclarecer especificamente. Ex: 'Ficou alguma duvida sobre [topico mencionado antes]?'",
        "PROVOCACAO DE CURIOSIDADE: insinue que tem opcao que combina com o perfil dele, sem entregar tudo. Ex: 'Tem uma opcao aqui que me lembrou voce, posso te mostrar?'",
        "PERGUNTA DE PRAZO: 'Voce esta pensando em decidir nos proximos 30 dias, ou ainda esta na fase de comparar?' — calibra urgencia.",
        "PERGUNTA SOBRE ESTILO DE VIDA: o que ele faz, como vive — pra calibrar a oferta. Ex: 'Esse imovel seria pra morar, veranear, ou investir?'",
        "COMENTARIO DE AUTORIDADE LEVE: traga uma observacao de quem conhece a regiao a fundo. Ex: 'Pra quem busca tranquilidade, a Taiba tem um aspecto que poucos lugares conseguem manter...'",
        "COMENTARIO DE OPORTUNIDADE: comente sobre o momento do mercado de forma genuina, sem ser apelativo. Ex: 'O mercado da Taiba esta numa fase interessante de valorizacao consistente.'",
        "CONVITE PRA CONTINUAR: pergunte se ele quer continuar a conversa por aqui ou prefere agendar uma ligacao/call pra falar com mais calma.",
      ]
      // Hash determinista do conversa.id + dia pra escolher angulo (evita repetir mesmo angulo no mesmo dia)
      const hoje = new Date().toISOString().slice(0, 10)
      const semente = `${conversa.id}-${hoje}`
      let hash = 0
      for (let i = 0; i < semente.length; i++) {
        hash = (hash * 31 + semente.charCodeAt(i)) | 0
      }
      const anguloEscolhido = ANGULOS[Math.abs(hash) % ANGULOS.length]

      // Anti-robô: espalhar envios entre as duas horas de cada golden hour
      // (12h/13h e 18h/19h). Sem isso TODOS os follow-ups saem às 12:00 em
      // ponto, que é assinatura de automação. Cada lead tem uma hora
      // "preferida" determinística; na outra hora ele é pulado.
      const horaPreferidaImpar = (Math.abs(hash) >> 4) % 2 === 1
      if ((horaAtual % 2 === 1) !== horaPreferidaImpar) {
        pulados++
        continue
      }

      // Modo campanha Guarujá: o follow-up deve girar em torno do Guarujá
      // com os fatos oficiais, sem inventar outros imóveis
      const { detectarLeadGuaruja } = await import("@/lib/whatsapp/campanha-guaruja")
      const ehLeadGuaruja = detectarLeadGuaruja(
        msgsHistorico.map((m) => m.conteudo)
      )
      const contextoGuaruja = ehLeadGuaruja
        ? `

CONTEXTO OBRIGATORIO: esse lead veio da campanha do GUARUJA CONDOMINIUM (condominio fechado de lotes em Caucaia, a 12 km do Cumbuco). Fatos que voce PODE usar: lotes de 150m2 a partir de R$ 112.500, entrada de 10%, parcelas a partir de R$ 699,90 sem juros direto com a incorporadora, entrega prevista dez/2028, pagina oficial https://guaruja.dunarealestate.com.br . O follow-up deve girar em torno do Guaruja. NAO mencione outros imoveis nem invente dados fora desses.`
        : ""

      // Gerar mensagem de re-engajamento contextual com Claude Haiku
      let mensagem = ""
      try {
        const { getAnthropic } = await import("@/lib/anthropic")
        const sys = `Voce e ${nomeAgente}, atendente humana da imobiliaria ${nomeOrg}, mulher cearense de Fortaleza, calorosa e profissional, especialista na Praia da Taiba e em Caucaia.${contextoGuaruja}

REGRA DE TRATAMENTO INEGOCIAVEL: SEMPRE use "voce". NUNCA "tu", "ti", "teu", "tua", "contigo". Cliente alto padrao da ${nomeOrg} espera tratamento respeitoso.

Sua tarefa AGORA: gerar UMA UNICA mensagem de re-engajamento (follow-up) pra cliente que parou de responder ha algumas horas.

ANGULO OBRIGATORIO DESSA MENSAGEM (siga rigorosamente): ${anguloEscolhido}

FILOSOFIA DA DUNA (orientacao do dono):
- Antes de empurrar imovel, ENTENDER o cliente: motivo (dor, necessidade ou emocao), estilo de vida, localizacao atual, perfil.
- A compra de imovel quase sempre tem uma historia por tras. Demonstre interesse genuino nessa historia.
- Mostre autoridade leve (quem conhece a regiao) sem ser arrogante. Nunca soe como vendedora aflita.

Regras de escrita:
- Maximo 2 linhas curtas estilo WhatsApp. Sem textao.
- ${nomeCliente ? `Pode usar o nome "${nomeCliente}" no inicio se ficar natural — NAO obrigatorio.` : "Nao use nome, voce ainda nao sabe."}
- NUNCA comece com saudacao (Bom dia/Boa tarde/Boa noite/Oi/Ola) — voce JA se apresentou nessa conversa; saudar de novo e marca de robo.
- Sem emojis (cliente alto padrao acha esquisito).
- Sem travessao (—). Use ponto ou virgula.
- Sem markdown, sem negrito.

⛔ FRASES E ABERTURAS PROIBIDAS (banidas pelo dono da imobiliaria):
- "To aqui se precisar"
- "Estou aqui se precisar"
- "Estou disponivel"
- "Fica a vontade pra retomar"
- "Tudo certo por ai?"
- "Como esta o seu dia?"
- "Lembrei de voce"
- "Passei pra saber"
- "Vi que paramos"
- "Notei que voce nao respondeu"
- "Estava pensando em voce"
- Comecos com "Claro!", "Otimo!", "Perfeito!", "Olha so"
NAO use NENHUMA dessas. Sao consideradas robotizadas e repetitivas pela imobiliaria.

CRITICO — NAO REPETIR PADRAO DAS ULTIMAS MENSAGENS:
Voce JA mandou essas mensagens recentes nessa conversa:
${ultimosTextos.length > 0 ? ultimosTextos.map((t, i) => `${i + 1}. "${t}"`).join("\n") : "(nenhuma mensagem anterior registrada)"}

NUNCA repita expressoes, aberturas, estrutura, nem mencione assuntos que ja foram cobertos da mesma forma. Varia COMPLETAMENTE.

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
      // ATENCAO: NENHUMA dessas frases pode conter "to aqui se precisar", "como esta o seu dia",
      // "lembrei de voce", "fica a vontade". Todas banidas pelo dono da imobiliaria.
      if (!mensagem) {
        const nomePrefix = nomeCliente ? `${nomeCliente}, ` : ""
        const FALLBACKS = [
          `${nomePrefix}pensei numa duvida que vale a pena explorar: o que esta pesando mais na sua decisao agora, a regiao ou o valor?`,
          `${nomeCliente ? `${nomeCliente}, ` : ""}entre as opcoes que conversamos, alguma fez mais sentido com o que voce procura?`,
          `${nomePrefix}voce ja teve a chance de pensar no que falamos? Posso te ajudar a destrinchar algum ponto especifico.`,
          `${nomePrefix}essa decisao costuma envolver bastante reflexao. Tem algum aspecto que voce gostaria de aprofundar antes de decidir?`,
          `${nomePrefix}quer que eu organize uma visita pra voce conhecer o imovel pessoalmente? As vezes ver no local muda tudo.`,
          `${nomeCliente ? `${nomeCliente}, ` : ""}me conta uma coisa: voce esta pensando mais em moradia, veraneio ou investimento? Isso ajuda a refinar as opcoes.`,
          `${nomePrefix}qual seria o melhor momento pra gente conversar com mais calma sobre as opcoes que combinam com voce?`,
          `${nomePrefix}surgiu uma novidade na regiao que pode te interessar. Quer que eu te conte?`,
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
