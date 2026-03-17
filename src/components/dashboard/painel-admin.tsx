import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  CalendarCheck,
  Handshake,
  MessageCircle,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react"
import { CardKpi } from "./cards-kpi"
import { GraficoStatusNegocios } from "./grafico-status-negocios"
import { ListaAtividadesHoje, type AtividadeHojeItem } from "./lista-atividades-hoje"
import { CardResumoSemanal } from "./card-resumo-semanal"

interface PainelAdminProps {
  nomeUsuario: string
  cargo: "admin" | "gerente"
  negociosAbertos: number
  negociosGanhos: number
  negociosPerdidos: number
  totalClientes: number
  imoveisDisponiveis: number
  atividadesHoje: number
  conversasAtivas: number
  atividadesPendentes: AtividadeHojeItem[]
}

export function PainelAdmin({
  nomeUsuario,
  cargo,
  negociosAbertos,
  negociosGanhos,
  negociosPerdidos,
  totalClientes,
  imoveisDisponiveis,
  atividadesHoje,
  conversasAtivas,
  atividadesPendentes,
}: PainelAdminProps) {
  const labelCargo = cargo === "gerente" ? "Gerente" : "Admin"
  const descricaoCargo =
    cargo === "gerente"
      ? "Visão geral da equipe."
      : "Visão geral da imobiliária."

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Olá, {nomeUsuario}!</h1>
          <p className="text-sm text-muted-foreground">{descricaoCargo}</p>
        </div>
        <Badge variant="secondary" className="mt-1 shrink-0">
          {labelCargo}
        </Badge>
      </div>

      {/* KPI cards */}
      <div
        id="onborda-dashboard-cards"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <CardKpi
          titulo="Negócios abertos"
          valor={negociosAbertos}
          descricao={
            negociosAbertos === 0
              ? "Nenhum em andamento"
              : `${negociosAbertos} em andamento`
          }
          icone={Handshake}
          href="/negocios"
          variante="primary"
        />
        <CardKpi
          titulo="Total de clientes"
          valor={totalClientes}
          descricao={totalClientes === 0 ? "Nenhum cadastrado" : `${totalClientes} no CRM`}
          icone={Users}
          href="/clientes"
          variante="info"
        />
        <CardKpi
          titulo="Imóveis disponíveis"
          valor={imoveisDisponiveis}
          descricao={
            imoveisDisponiveis === 0
              ? "Nenhum no portfólio"
              : `${imoveisDisponiveis} no portfólio`
          }
          icone={Building2}
          href="/imoveis"
          variante="success"
        />
        <CardKpi
          titulo="Conversas ativas"
          valor={conversasAtivas}
          descricao={
            conversasAtivas === 0
              ? "Nenhuma conversa"
              : `${conversasAtivas} em andamento`
          }
          icone={MessageCircle}
          href="/conversas"
          variante="warning"
        />
      </div>

      {/* Gráfico de negócios + Resumo semanal */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Negócios por Status</CardTitle>
            </div>
            <CardDescription>
              {negociosGanhos} ganho{negociosGanhos !== 1 ? "s" : ""},{" "}
              {negociosPerdidos} perdido{negociosPerdidos !== 1 ? "s" : ""} no total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoStatusNegocios
              abertos={negociosAbertos}
              ganhos={negociosGanhos}
              perdidos={negociosPerdidos}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <CardResumoSemanal />
        </div>
      </div>

      {/* Atividades pendentes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Atividades Pendentes</CardTitle>
              <CardDescription>
                {atividadesHoje === 0
                  ? "Nenhuma atividade agendada para hoje"
                  : `${atividadesHoje} agendada${atividadesHoje !== 1 ? "s" : ""} para hoje`}
              </CardDescription>
            </div>
            <Link href="/atividades">
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ListaAtividadesHoje atividades={atividadesPendentes} />
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <div id="onborda-acoes-rapidas">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/imoveis/novo">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Novo Imóvel
            </Button>
          </Link>
          <Link href="/clientes/novo">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
          <Link href="/negocios/novo">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Novo Negócio
            </Button>
          </Link>
          <Link href="/configuracoes">
            <Button variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
