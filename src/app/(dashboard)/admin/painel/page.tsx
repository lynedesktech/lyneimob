import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Building,
  Users,
  Building2,
  Handshake,
  CreditCard,
  AlertTriangle,
} from "lucide-react"

export default async function AdminPainelPage() {
  // Guard: verificar se é super_admin
  const supabase = await criarClienteServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("super_admin")
    .eq("id", user.id)
    .single()

  if (!usuario?.super_admin) redirect("/painel")

  // Usar cliente admin para queries cross-org (bypassa RLS)
  const admin = criarClienteAdmin()

  // Métricas em paralelo
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

  // Contar orgs por plano
  const contadorPlanos = { trial: 0, crm_ia: 0, crm_ia_sdr: 0 }
  orgsPorPlano?.forEach((org: { plano: string }) => {
    if (org.plano in contadorPlanos) {
      contadorPlanos[org.plano as keyof typeof contadorPlanos]++
    }
  })

  const CORES_CARDS = [
    "bg-primary/10 text-primary dark:bg-primary/15",
    "bg-info/10 text-info dark:bg-info/15",
    "bg-success/10 text-success dark:bg-success/15",
    "bg-warning/10 text-warning dark:bg-warning/15",
    "bg-destructive/10 text-destructive dark:bg-destructive/15",
    "bg-accent text-muted-foreground",
  ] as const

  const cards = [
    {
      titulo: "Organizações",
      valor: String(totalOrgs ?? 0),
      descricao: `${contadorPlanos.trial} essencial · ${contadorPlanos.crm_ia} profissional · ${contadorPlanos.crm_ia_sdr} completo`,
      icone: Building,
    },
    {
      titulo: "Usuários totais",
      valor: String(totalUsuarios ?? 0),
      descricao: "Em todas as organizações",
      icone: Users,
    },
    {
      titulo: "Imóveis totais",
      valor: String(totalImoveis ?? 0),
      descricao: "Cadastrados na plataforma",
      icone: Building2,
    },
    {
      titulo: "Negócios totais",
      valor: String(totalNegocios ?? 0),
      descricao: "Em todas as organizações",
      icone: Handshake,
    },
    {
      titulo: "Trials expirados",
      valor: String(orgsTrialExpirado?.length ?? 0),
      descricao: "Orgs com trial vencido",
      icone: AlertTriangle,
    },
    {
      titulo: "Assinaturas ativas",
      valor: String(contadorPlanos.crm_ia + contadorPlanos.crm_ia_sdr),
      descricao: "Planos pagos ativos",
      icone: CreditCard,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Painel da Plataforma
        </h1>
        <p className="text-muted-foreground">
          Visão geral de todas as organizações e métricas do SaaS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Card key={card.titulo}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.titulo}
              </CardTitle>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${CORES_CARDS[i]}`}
              >
                <card.icone className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.valor}</div>
              <CardDescription>{card.descricao}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
