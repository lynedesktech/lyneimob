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

interface MetricasPlataforma {
  totalOrgs: number
  totalUsuarios: number
  totalImoveis: number
  totalNegocios: number
  trialsExpirados: number
  assinaturasAtivas: number
  planosBreakdown: {
    trial: number
    crm_ia: number
    crm_ia_sdr: number
  }
}

const CORES_CARDS = [
  "bg-primary/10 text-primary dark:bg-primary/15",
  "bg-info/10 text-info dark:bg-info/15",
  "bg-success/10 text-success dark:bg-success/15",
  "bg-warning/10 text-warning dark:bg-warning/15",
  "bg-destructive/10 text-destructive dark:bg-destructive/15",
  "bg-accent text-muted-foreground",
] as const

export function PainelSuperAdmin({
  totalOrgs,
  totalUsuarios,
  totalImoveis,
  totalNegocios,
  trialsExpirados,
  assinaturasAtivas,
  planosBreakdown,
}: MetricasPlataforma) {
  const cards = [
    {
      titulo: "Organizações",
      valor: String(totalOrgs),
      descricao: `${planosBreakdown.trial} trial · ${planosBreakdown.crm_ia} profissional · ${planosBreakdown.crm_ia_sdr} completo`,
      icone: Building,
    },
    {
      titulo: "Usuários totais",
      valor: String(totalUsuarios),
      descricao: "Em todas as organizações",
      icone: Users,
    },
    {
      titulo: "Imóveis totais",
      valor: String(totalImoveis),
      descricao: "Cadastrados na plataforma",
      icone: Building2,
    },
    {
      titulo: "Negócios totais",
      valor: String(totalNegocios),
      descricao: "Em todas as organizações",
      icone: Handshake,
    },
    {
      titulo: "Trials expirados",
      valor: String(trialsExpirados),
      descricao: "Orgs com trial vencido",
      icone: AlertTriangle,
    },
    {
      titulo: "Assinaturas ativas",
      valor: String(assinaturasAtivas),
      descricao: "Planos pagos ativos",
      icone: CreditCard,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Visão da Plataforma</h2>
        <p className="text-sm text-muted-foreground">
          Métricas globais de todas as organizações
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Card key={card.titulo}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.titulo}</CardTitle>
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
