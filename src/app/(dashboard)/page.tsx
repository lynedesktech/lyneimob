import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2, Handshake, Users, CalendarCheck } from "lucide-react"
import { criarClienteServer } from "@/lib/supabase/server"

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

  const cards = [
    {
      titulo: "Negócios abertos",
      valor: "0",
      descricao: "Nenhum negócio ainda",
      icone: Handshake,
    },
    {
      titulo: "Clientes",
      valor: "0",
      descricao: "Nenhum cliente cadastrado",
      icone: Users,
    },
    {
      titulo: "Imóveis ativos",
      valor: "0",
      descricao: "Nenhum imóvel cadastrado",
      icone: Building2,
    },
    {
      titulo: "Atividades do dia",
      valor: "0",
      descricao: "Nenhuma atividade agendada",
      icone: CalendarCheck,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bem-vindo, {usuario?.nome ?? "Usuário"}!
        </h1>
        <p className="text-muted-foreground">
          Aqui está o resumo da sua imobiliária.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.titulo}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.titulo}
              </CardTitle>
              <card.icone className="h-4 w-4 text-muted-foreground" />
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
