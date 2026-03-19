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
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"

interface MetricasInvestidor {
  totalOrgs: number
  totalUsuarios: number
  totalImoveis: number
  totalNegocios: number
  taxaConversao: number
  crescimentoMensal: {
    mes: string
    orgs: number
    usuarios: number
  }[]
}

const CORES_CARDS = [
  "bg-primary/10 text-primary dark:bg-primary/15",
  "bg-info/10 text-info dark:bg-info/15",
  "bg-success/10 text-success dark:bg-success/15",
  "bg-warning/10 text-warning dark:bg-warning/15",
  "bg-accent text-muted-foreground",
  "bg-primary/10 text-primary dark:bg-primary/15",
] as const

export function PainelInvestidor({
  totalOrgs,
  totalUsuarios,
  totalImoveis,
  totalNegocios,
  taxaConversao,
  crescimentoMensal,
}: MetricasInvestidor) {
  const cards = [
    {
      titulo: "Organizações",
      valor: String(totalOrgs),
      descricao: "Imobiliárias cadastradas",
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
      titulo: "Taxa de conversão",
      valor: `${taxaConversao}%`,
      descricao: "Trial → Plano pago",
      icone: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Visão do Investidor</h2>
        <p className="text-sm text-muted-foreground">
          Métricas de crescimento e adoção da plataforma
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

      {/* Crescimento mensal */}
      {crescimentoMensal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="h-5 w-5 text-success" />
              Crescimento mensal
            </CardTitle>
            <CardDescription>Novas organizações e usuários por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crescimentoMensal.map((item) => (
                <div key={item.mes} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.mes}</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>{item.orgs} org{item.orgs !== 1 ? "s" : ""}</span>
                    <span>{item.usuarios} usuário{item.usuarios !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
