import { criarClienteServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  MessageCircle,
  UsersRound,
  Route,
  Plug,
  Globe,
  ShieldAlert,
  ChevronRight,
  Kanban,
  ListTodo,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const cardsConfiguracoes = [
  {
    titulo: "Dados da Empresa",
    descricao: "Nome, telefone, CRECI, endereço",
    href: "/configuracoes/empresa",
    icone: Building2,
  },
  {
    titulo: "WhatsApp",
    descricao: "Conexão e configuração do agente",
    href: "/configuracoes/whatsapp",
    icone: MessageCircle,
  },
  {
    titulo: "Equipe",
    descricao: "Membros, convites e cargos",
    href: "/configuracoes/equipe",
    icone: UsersRound,
  },
  {
    titulo: "Funil de Vendas",
    descricao: "Etapas do pipeline: nome, cor e ordem",
    href: "/configuracoes/pipeline",
    icone: Kanban,
  },
  {
    titulo: "Tipos de Atividade",
    descricao: "Categorias de tarefas: nome, cor e ordem",
    href: "/configuracoes/tipos-atividade",
    icone: ListTodo,
  },
  {
    titulo: "Distribuição de Leads",
    descricao: "Regras de distribuição entre corretores",
    href: "/configuracoes/distribuicao",
    icone: Route,
  },
  {
    titulo: "Portais",
    descricao: "Feed XML, webhook e leads recebidos",
    href: "/configuracoes/portais",
    icone: Plug,
  },
  {
    titulo: "Meu Site",
    descricao: "Cores, hero, sobre nós, domínio",
    href: "/configuracoes/meu-site",
    icone: Globe,
  },
]

export default async function ConfiguracoesPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("organizacao_id, cargo, super_admin")
    .eq("id", user.id)
    .single()

  if (!usuario) redirect("/login")

  if (usuario.super_admin) {
    redirect("/admin/configuracoes")
  }

  if (usuario.cargo !== "admin") {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Apenas administradores podem acessar as configurações.
          Entre em contato com o administrador da sua imobiliária.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie sua imobiliária, equipe, integrações e site
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cardsConfiguracoes.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <card.icone className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium leading-tight">{card.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{card.descricao}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
