import { criarClienteServer } from "@/lib/supabase/server"
import { PainelAdmin } from "@/components/dashboard/painel-admin"
import { PainelCorretor } from "@/components/dashboard/painel-corretor"
import type { AtividadeHojeItem } from "@/components/dashboard/lista-atividades-hoje"

export default async function DashboardPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome, cargo")
    .eq("id", user?.id)
    .single()

  const nomeUsuario = usuario?.nome ?? "Usuário"
  const cargo = usuario?.cargo ?? "corretor"
  const isCorretor = cargo === "corretor"

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

    return (
      <PainelCorretor
        nomeUsuario={nomeUsuario}
        negociosAbertos={negociosAbertos ?? 0}
        clientesAtivos={clientesAtivos ?? 0}
        atividadesHoje={atividadesHoje ?? 0}
        conversasAtivas={conversasAtivas ?? 0}
        atividadesLista={atividadesLista}
      />
    )
  }

  // ── Painel do Admin / Gerente ────────────────────────────────────────

  const [
    { count: negociosAbertos },
    { count: negociosGanhos },
    { count: negociosPerdidos },
    { count: totalClientes },
    { count: imoveisDisponiveis },
    { count: atividadesHoje },
    { count: conversasAtivas },
    { data: rawAtividades },
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
  ])

  const atividadesPendentes: AtividadeHojeItem[] = (rawAtividades ?? []).map((a) => ({
    id: a.id,
    titulo: a.titulo,
    tipo: a.tipo,
    data_inicio: a.data_inicio,
    cliente_nome:
      (a.clientes as unknown as { nome: string } | null)?.nome ?? null,
  }))

  return (
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
    />
  )
}
