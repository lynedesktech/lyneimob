import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Handshake, Users, CalendarCheck, MessageCircle, Plus } from "lucide-react"
import { criarClienteServer } from "@/lib/supabase/server"
import { ChecklistOnboarding } from "@/components/onboarding/checklist-onboarding"
import { CardResumoSemanal } from "@/components/dashboard/card-resumo-semanal"

const CORES_CARDS = [
  "bg-primary/10 text-primary dark:bg-primary/15",
  "bg-info/10 text-info dark:bg-info/15",
  "bg-success/10 text-success dark:bg-success/15",
  "bg-warning/10 text-warning dark:bg-warning/15",
  "bg-accent text-muted-foreground",
] as const

export default async function DashboardPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome")
    .eq("id", user?.id)
    .single()

  // Contar atividades pendentes do dia
  const hoje = new Date()
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

  const { count: atividadesHoje } = await supabase
    .from("atividades")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente")
    .gte("data_inicio", inicioDia)
    .lt("data_inicio", fimDia)

  const qtdAtividades = atividadesHoje ?? 0

  // Contar conversas WhatsApp ativas
  const { count: conversasAtivas } = await supabase
    .from("conversas_whatsapp")
    .select("id", { count: "exact", head: true })
    .eq("status", "em_andamento")

  const qtdConversas = conversasAtivas ?? 0

  // Contar negócios abertos
  const { count: negociosAbertos } = await supabase
    .from("negocios")
    .select("id", { count: "exact", head: true })
    .eq("status", "aberto")

  const qtdNegocios = negociosAbertos ?? 0

  // Contar todos os clientes
  const { count: totalClientes } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })

  const qtdClientes = totalClientes ?? 0

  // Contar imóveis disponíveis
  const { count: imoveisDisponiveis } = await supabase
    .from("imoveis")
    .select("id", { count: "exact", head: true })
    .eq("status", "disponivel")

  const qtdImoveis = imoveisDisponiveis ?? 0

  const cards = [
    {
      titulo: "Negócios abertos",
      valor: String(qtdNegocios),
      descricao: qtdNegocios === 0
        ? "Nenhum negócio ainda"
        : `${qtdNegocios} negócio${qtdNegocios !== 1 ? "s" : ""} em andamento`,
      icone: Handshake,
      href: "/negocios",
    },
    {
      titulo: "Clientes",
      valor: String(qtdClientes),
      descricao: qtdClientes === 0
        ? "Nenhum cliente cadastrado"
        : `${qtdClientes} cliente${qtdClientes !== 1 ? "s" : ""} cadastrado${qtdClientes !== 1 ? "s" : ""}`,
      icone: Users,
      href: "/clientes",
    },
    {
      titulo: "Imóveis ativos",
      valor: String(qtdImoveis),
      descricao: qtdImoveis === 0
        ? "Nenhum imóvel cadastrado"
        : `${qtdImoveis} imóve${qtdImoveis !== 1 ? "is" : "l"} disponíve${qtdImoveis !== 1 ? "is" : "l"}`,
      icone: Building2,
      href: "/imoveis",
    },
    {
      titulo: "Atividades do dia",
      valor: String(qtdAtividades),
      descricao: qtdAtividades === 0
        ? "Nenhuma atividade agendada"
        : `${qtdAtividades} atividade${qtdAtividades !== 1 ? "s" : ""} para hoje`,
      icone: CalendarCheck,
      href: "/atividades",
    },
    {
      titulo: "Conversas WhatsApp",
      valor: String(qtdConversas),
      descricao: qtdConversas === 0
        ? "Nenhuma conversa ativa"
        : `${qtdConversas} conversa${qtdConversas !== 1 ? "s" : ""} em andamento`,
      icone: MessageCircle,
      href: "/conversas",
    },
  ]

  const acoesRapidas = [
    { label: "Novo Imóvel", href: "/imoveis/novo", icone: Building2 },
    { label: "Novo Cliente", href: "/clientes/novo", icone: Users },
    { label: "Novo Negócio", href: "/negocios/novo", icone: Handshake },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bem-vindo, {usuario?.nome ?? "Usuário"}!
        </h1>
        <p className="text-muted-foreground">
          Aqui está o resumo da sua imobiliária.
        </p>
      </div>

      {/* Checklist de onboarding (some quando completar tudo) */}
      <ChecklistOnboarding />

      {/* Resumo semanal gerado por IA */}
      <CardResumoSemanal />

      {/* Cards de métricas */}
      <div id="onborda-dashboard-cards" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, i) => (
          <Link key={card.titulo} href={card.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.titulo}
                </CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${CORES_CARDS[i]}`}>
                  <card.icone className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.valor}</div>
                <CardDescription>{card.descricao}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Ações rápidas */}
      <div id="onborda-acoes-rapidas">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          {acoesRapidas.map((acao) => (
            <Link key={acao.label} href={acao.href}>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {acao.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
