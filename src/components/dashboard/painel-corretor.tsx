import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2,
  CalendarCheck,
  Handshake,
  MessageCircle,
  Plus,
  Users,
} from "lucide-react"
import { CardKpi } from "./cards-kpi"
import { ListaAtividadesHoje, type AtividadeHojeItem } from "./lista-atividades-hoje"
import { ChecklistOnboarding } from "@/components/onboarding/checklist-onboarding"
import { CardResumoSemanal } from "./card-resumo-semanal"

interface PainelCorretorProps {
  nomeUsuario: string
  negociosAbertos: number
  clientesAtivos: number
  atividadesHoje: number
  conversasAtivas: number
  atividadesLista: AtividadeHojeItem[]
}

export function PainelCorretor({
  nomeUsuario,
  negociosAbertos,
  clientesAtivos,
  atividadesHoje,
  conversasAtivas,
  atividadesLista,
}: PainelCorretorProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {nomeUsuario}!</h1>
        <p className="text-sm text-muted-foreground">Aqui está o resumo do seu dia.</p>
      </div>

      {/* Checklist de onboarding (some quando completar tudo) */}
      <ChecklistOnboarding />

      {/* KPI cards */}
      <div
        id="onborda-dashboard-cards"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <CardKpi
          titulo="Meus negócios"
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
          titulo="Meus clientes"
          valor={clientesAtivos}
          descricao={
            clientesAtivos === 0
              ? "Nenhum cadastrado"
              : `${clientesAtivos} ativo${clientesAtivos !== 1 ? "s" : ""}`
          }
          icone={Users}
          href="/clientes"
          variante="info"
        />
        <CardKpi
          titulo="Atividades hoje"
          valor={atividadesHoje}
          descricao={
            atividadesHoje === 0
              ? "Nenhuma agendada"
              : `${atividadesHoje} pendente${atividadesHoje !== 1 ? "s" : ""}`
          }
          icone={CalendarCheck}
          href="/atividades"
          variante="warning"
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
          href="/negocios"
          variante="success"
        />
      </div>

      {/* Resumo IA + Atividades de hoje */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardResumoSemanal />

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Atividades de Hoje</CardTitle>
              <Link href="/atividades">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ListaAtividadesHoje atividades={atividadesLista} />
          </CardContent>
        </Card>
      </div>

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
        </div>
      </div>
    </div>
  )
}
