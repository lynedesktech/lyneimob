import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { gerarResumoParaOrganizacao, obterLimitesSemana, formatarDateISO } from "@/lib/resumo-semanal/gerar-resumo"

// Vercel executa por ate 5 minutos (suficiente para 500+ orgs)
export const maxDuration = 300

export async function GET(request: Request) {
  // Validar token de autorizacao do cron
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  const supabase = criarClienteAdmin()
  const { inicio } = obterLimitesSemana()
  const semanaInicioStr = formatarDateISO(inicio)

  // Buscar todas as organizacoes ativas (plano nao cancelado e trial nao expirado)
  const { data: todasOrgs, error: erroOrgs } = await supabase
    .from("organizacoes")
    .select("id, plano, plano_status, trial_fim_em")
    .neq("plano_status", "canceled")

  if (erroOrgs || !todasOrgs) {
    console.error("[cron/resumo-semanal] Erro ao buscar organizações:", erroOrgs?.message)
    return NextResponse.json({ erro: "Erro ao buscar organizações" }, { status: 500 })
  }

  // Filtrar trials expirados
  const agora = new Date()
  const orgsAtivas = todasOrgs.filter((org) => {
    if (org.plano === "trial" && org.trial_fim_em) {
      return new Date(org.trial_fim_em) >= agora
    }
    return true
  })

  // Buscar quais ja tem resumo da semana atual (para nao duplicar)
  const { data: resumosExistentes } = await supabase
    .from("resumos_semanais")
    .select("organizacao_id")
    .eq("semana_inicio", semanaInicioStr)

  const idsComResumo = new Set((resumosExistentes ?? []).map((r) => r.organizacao_id))

  // Filtrar apenas orgs que ainda nao tem resumo
  const orgsPendentes = orgsAtivas.filter((org) => !idsComResumo.has(org.id))

  const contadores = {
    total: orgsAtivas.length,
    ja_existiam: idsComResumo.size,
    a_processar: orgsPendentes.length,
    gerados: 0,
    sem_dados: 0,
    erros: 0,
  }

  if (orgsPendentes.length === 0) {
    console.log("[cron/resumo-semanal] Todas as organizações já têm resumo da semana.")
    return NextResponse.json(contadores)
  }

  // Processar em lotes de 10 para nao sobrecarregar a OpenAI
  const TAMANHO_LOTE = 10

  for (let i = 0; i < orgsPendentes.length; i += TAMANHO_LOTE) {
    const lote = orgsPendentes.slice(i, i + TAMANHO_LOTE)

    const resultados = await Promise.allSettled(
      lote.map((org) => gerarResumoParaOrganizacao(supabase, org.id))
    )

    for (const resultado of resultados) {
      if (resultado.status === "fulfilled") {
        const r = resultado.value
        if (r.sucesso) {
          if (r.motivo === "sem_dados") {
            contadores.sem_dados++
          } else {
            contadores.gerados++
          }
        } else {
          contadores.erros++
          console.error("[cron/resumo-semanal] Erro em org:", r.erro)
        }
      } else {
        contadores.erros++
        console.error("[cron/resumo-semanal] Rejeição inesperada:", resultado.reason)
      }
    }
  }

  console.log("[cron/resumo-semanal] Concluído:", contadores)
  return NextResponse.json(contadores)
}
