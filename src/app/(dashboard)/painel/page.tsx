import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { PainelAdmin } from "@/components/dashboard/painel-admin"
import { PainelCorretor } from "@/components/dashboard/painel-corretor"
import { PainelSuperAdmin } from "@/components/painel/painel-super-admin"
import { PainelInvestidor } from "@/components/painel/painel-investidor"
import type { AtividadeHojeItem } from "@/components/dashboard/lista-atividades-hoje"
import type { EtapaFunil } from "@/components/dashboard/grafico-funil"
import type { PontoMensal } from "@/components/dashboard/grafico-evolucao"
import type { PerfilPlataforma } from "@/lib/permissoes"

export default async function DashboardPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome, cargo, super_admin, perfil_plataforma")
    .eq("id", user?.id)
    .single()

  const nomeUsuario = usuario?.nome ?? "Usuário"
  const cargo = usuario?.cargo ?? "corretor"
  const perfilPlataforma = (usuario?.perfil_plataforma ?? (usuario?.super_admin ? "super_admin" : null)) as PerfilPlataforma
  const isCorretor = cargo === "corretor" && !perfilPlataforma

  // Perfis de plataforma veem painel específico
  if (perfilPlataforma === "investidor") {
    const metricas = await buscarMetricasInvestidor()
    return (
      <div className="space-y-10">
        <PainelInvestidor {...metricas} />
      </div>
    )
  }

  if (perfilPlataforma === "desenvolvedor") {
    const metricas = await buscarMetricasPlataforma()
    return (
      <div className="space-y-10">
        <PainelSuperAdmin {...metricas} esconderFinanceiro />
      </div>
    )
  }

  // Datas de hoje
  const hoje = new Date()
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

  if (isCorretor) {
    // ── Painel do Corretor ────────────────────────────────────────────

    const [
      { count: negociosAbertos },
      { count: clientesAtivos },
      { count: atividadesHoje },
      { count: conversasAtivas },
      { data: rawAtividades },
    ] = await Promise.all([
      supabase
        .from("negocios")
        .select("id", { count: "exact", head: true })
        .eq("corretor_id", user!.id)
        .eq("status", "aberto"),

      supabase
        .from("clientes")
        .select("id", { count: "exact", head: true })
        .eq("corretor_id", user!.id)
        .eq("status", "ativo"),

      supabase
        .from("atividades")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", user!.id)
        .eq("status", "pendente")
        .gte("data_inicio", inicioDia)
        .lt("data_inicio", fimDia),

      supabase
        .from("conversas_whatsapp")
        .select("id", { count: "exact", head: true })
        .eq("status", "em_andamento"),

      supabase
        .from("atividades")
        .select("id, titulo, tipo, data_inicio, clientes(nome)")
        .eq("usuario_id", user!.id)
        .eq("status", "pendente")
        .gte("data_inicio", inicioDia)
        .lt("data_inicio", fimDia)
        .order("data_inicio", { ascending: true })
        .limit(5),
    ])

    const atividadesLista: AtividadeHojeItem[] = (rawAtividades ?? []).map((a) => ({
      id: a.id,
      titulo: a.titulo,
      tipo: a.tipo,
      data_inicio: a.data_inicio,
      cliente_nome:
        (a.clientes as unknown as { nome: string } | null)?.nome ?? null,
    }))

    const metricasPlataforma = perfilPlataforma === "super_admin"
      ? await buscarMetricasPlataforma()
      : null

    return (
      <div className="space-y-10">
        <PainelCorretor
          nomeUsuario={nomeUsuario}
          negociosAbertos={negociosAbertos ?? 0}
          clientesAtivos={clientesAtivos ?? 0}
          atividadesHoje={atividadesHoje ?? 0}
          conversasAtivas={conversasAtivas ?? 0}
          atividadesLista={atividadesLista}
        />
        {metricasPlataforma && <PainelSuperAdmin {...metricasPlataforma} />}
      </div>
    )
  }

  // ── Painel do Admin / Gerente ────────────────────────────────────────

  const seiseMesesAtras = new Date(hoje)
  seiseMesesAtras.setMonth(seiseMesesAtras.getMonth() - 6)

  const [
    { count: negociosAbertos },
    { count: negociosGanhos },
    { count: negociosPerdidos },
    { count: totalClientes },
    { count: imoveisDisponiveis },
    { count: atividadesHoje },
    { count: conversasAtivas },
    { data: rawAtividades },
    { data: rawEtapas },
    { data: rawNegociosPorEtapa },
    { data: rawImoveisPorStatus },
    { data: rawNegociosRecentes },
  ] = await Promise.all([
    supabase
      .from("negocios")
      .select("id", { count: "exact", head: true })
      .eq("status", "aberto"),

    supabase
      .from("negocios")
      .select("id", { count: "exact", head: true })
      .eq("status", "ganho"),

    supabase
      .from("negocios")
      .select("id", { count: "exact", head: true })
      .eq("status", "perdido"),

    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("imoveis")
      .select("id", { count: "exact", head: true })
      .eq("status", "disponivel"),

    supabase
      .from("atividades")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente")
      .gte("data_inicio", inicioDia)
      .lt("data_inicio", fimDia),

    supabase
      .from("conversas_whatsapp")
      .select("id", { count: "exact", head: true })
      .eq("status", "em_andamento"),

    supabase
      .from("atividades")
      .select("id, titulo, tipo, data_inicio, clientes(nome)")
      .eq("status", "pendente")
      .gte("data_inicio", inicioDia)
      .lt("data_inicio", fimDia)
      .order("data_inicio", { ascending: true })
      .limit(5),

    // Etapas do pipeline para o funil
    supabase
      .from("pipeline_etapas")
      .select("id, nome, cor")
      .eq("tipo", "normal")
      .order("ordem"),

    // Negócios abertos por etapa (para funil)
    supabase
      .from("negocios")
      .select("etapa_id")
      .eq("status", "aberto"),

    // Imóveis por status (para donut)
    supabase
      .from("imoveis")
      .select("status"),

    // Negócios dos últimos 6 meses (para evolução)
    supabase
      .from("negocios")
      .select("criado_em")
      .gte("criado_em", seiseMesesAtras.toISOString()),
  ])

  const atividadesPendentes: AtividadeHojeItem[] = (rawAtividades ?? []).map((a) => ({
    id: a.id,
    titulo: a.titulo,
    tipo: a.tipo,
    data_inicio: a.data_inicio,
    cliente_nome:
      (a.clientes as unknown as { nome: string } | null)?.nome ?? null,
  }))

  // Funil: contar negócios por etapa
  const contagemPorEtapa: Record<string, number> = {}
  for (const n of rawNegociosPorEtapa ?? []) {
    if (n.etapa_id) contagemPorEtapa[n.etapa_id] = (contagemPorEtapa[n.etapa_id] ?? 0) + 1
  }
  const etapasFunil: EtapaFunil[] = (rawEtapas ?? []).map((e) => ({
    nome: e.nome,
    cor: e.cor ?? "var(--chart-1)",
    total: contagemPorEtapa[e.id] ?? 0,
  }))

  // Imóveis por status
  const contagemImoveis = { disponivel: 0, reservado: 0, vendido: 0, alugado: 0 }
  for (const i of rawImoveisPorStatus ?? []) {
    if (i.status in contagemImoveis) {
      contagemImoveis[i.status as keyof typeof contagemImoveis]++
    }
  }

  // Evolução mensal: últimos 6 meses
  const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const evolucaoMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    evolucaoMap[chave] = 0
  }
  for (const n of rawNegociosRecentes ?? []) {
    if (!n.criado_em) continue
    const d = new Date(n.criado_em)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (chave in evolucaoMap) evolucaoMap[chave]++
  }
  const evolucaoMensal: PontoMensal[] = Object.entries(evolucaoMap).map(([chave, criados]) => {
    const [, mes] = chave.split("-")
    return { mes: MESES_PT[parseInt(mes) - 1], criados }
  })

  const metricasPlataforma = perfilPlataforma === "super_admin"
    ? await buscarMetricasPlataforma()
    : null

  return (
    <div className="space-y-10">
      <PainelAdmin
        nomeUsuario={nomeUsuario}
        cargo={cargo as "admin" | "gerente"}
        negociosAbertos={negociosAbertos ?? 0}
        negociosGanhos={negociosGanhos ?? 0}
        negociosPerdidos={negociosPerdidos ?? 0}
        totalClientes={totalClientes ?? 0}
        imoveisDisponiveis={imoveisDisponiveis ?? 0}
        atividadesHoje={atividadesHoje ?? 0}
        conversasAtivas={conversasAtivas ?? 0}
        atividadesPendentes={atividadesPendentes}
        etapasFunil={etapasFunil}
        imoveisPorStatus={contagemImoveis}
        evolucaoMensal={evolucaoMensal}
      />
      {metricasPlataforma && <PainelSuperAdmin {...metricasPlataforma} />}
    </div>
  )
}

async function buscarMetricasPlataforma() {
  const admin = criarClienteAdmin()

  const [
    { count: totalOrgs },
    { count: totalUsuarios },
    { count: totalImoveis },
    { count: totalNegocios },
    { data: orgsPorPlano },
    { data: orgsTrialExpirado },
  ] = await Promise.all([
    admin.from("organizacoes").select("id", { count: "exact", head: true }),
    admin.from("usuarios").select("id", { count: "exact", head: true }),
    admin.from("imoveis").select("id", { count: "exact", head: true }),
    admin.from("negocios").select("id", { count: "exact", head: true }),
    admin.from("organizacoes").select("plano"),
    admin
      .from("organizacoes")
      .select("id")
      .eq("plano", "trial")
      .lt("trial_fim_em", new Date().toISOString()),
  ])

  const planosBreakdown = { trial: 0, crm_ia: 0, crm_ia_sdr: 0 }
  orgsPorPlano?.forEach((org: { plano: string }) => {
    if (org.plano in planosBreakdown) {
      planosBreakdown[org.plano as keyof typeof planosBreakdown]++
    }
  })

  return {
    totalOrgs: totalOrgs ?? 0,
    totalUsuarios: totalUsuarios ?? 0,
    totalImoveis: totalImoveis ?? 0,
    totalNegocios: totalNegocios ?? 0,
    trialsExpirados: orgsTrialExpirado?.length ?? 0,
    assinaturasAtivas: planosBreakdown.crm_ia + planosBreakdown.crm_ia_sdr,
    planosBreakdown,
  }
}

async function buscarMetricasInvestidor() {
  const admin = criarClienteAdmin()
  const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

  const hoje = new Date()
  const seiseMesesAtras = new Date(hoje)
  seiseMesesAtras.setMonth(seiseMesesAtras.getMonth() - 6)

  const [
    { count: totalOrgs },
    { count: totalUsuarios },
    { count: totalImoveis },
    { count: totalNegocios },
    { data: orgsPorPlano },
    { data: orgsRecentes },
    { data: usuariosRecentes },
  ] = await Promise.all([
    admin.from("organizacoes").select("id", { count: "exact", head: true }),
    admin.from("usuarios").select("id", { count: "exact", head: true }),
    admin.from("imoveis").select("id", { count: "exact", head: true }),
    admin.from("negocios").select("id", { count: "exact", head: true }),
    admin.from("organizacoes").select("plano"),
    admin
      .from("organizacoes")
      .select("created_at")
      .gte("created_at", seiseMesesAtras.toISOString()),
    admin
      .from("usuarios")
      .select("created_at")
      .gte("created_at", seiseMesesAtras.toISOString()),
  ])

  // Taxa de conversão: orgs com plano pago / total de orgs
  let totalOrgsPagas = 0
  const totalOrgsNum = totalOrgs ?? 0
  orgsPorPlano?.forEach((org: { plano: string }) => {
    if (org.plano === "crm_ia" || org.plano === "crm_ia_sdr") totalOrgsPagas++
  })
  const taxaConversao = totalOrgsNum > 0
    ? Math.round((totalOrgsPagas / totalOrgsNum) * 100)
    : 0

  // Crescimento mensal
  const crescimentoMap: Record<string, { orgs: number; usuarios: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    crescimentoMap[chave] = { orgs: 0, usuarios: 0 }
  }

  for (const org of orgsRecentes ?? []) {
    if (!org.created_at) continue
    const d = new Date(org.created_at)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (chave in crescimentoMap) crescimentoMap[chave].orgs++
  }

  for (const usr of usuariosRecentes ?? []) {
    if (!usr.created_at) continue
    const d = new Date(usr.created_at)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (chave in crescimentoMap) crescimentoMap[chave].usuarios++
  }

  const crescimentoMensal = Object.entries(crescimentoMap).map(([chave, dados]) => {
    const [, mes] = chave.split("-")
    return {
      mes: MESES_PT[parseInt(mes) - 1],
      orgs: dados.orgs,
      usuarios: dados.usuarios,
    }
  })

  return {
    totalOrgs: totalOrgsNum,
    totalUsuarios: totalUsuarios ?? 0,
    totalImoveis: totalImoveis ?? 0,
    totalNegocios: totalNegocios ?? 0,
    taxaConversao,
    crescimentoMensal,
  }
}
