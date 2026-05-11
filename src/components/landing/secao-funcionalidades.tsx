import {
  Building2,
  Sparkles,
  KanbanSquare,
  MessageCircle,
  Globe,
  Link2,
} from "lucide-react"

const funcionalidades = [
  {
    icone: Building2,
    titulo: "Gestão completa",
    descricao:
      "Gerencie imóveis, clientes, negócios e atividades em um só lugar. Tudo organizado pra você focar no que importa: vender.",
    cor: "bg-accent text-accent-foreground",
  },
  {
    icone: Sparkles,
    titulo: "IA em todos os módulos",
    descricao:
      "Descrições de imóveis, análise de perfil de clientes, sugestões de ação em negócios — a IA trabalha junto com você.",
    cor: "bg-accent-blue/10 text-accent-blue",
  },
  {
    icone: KanbanSquare,
    titulo: "Pipeline visual",
    descricao:
      "Acompanhe seus negócios em um Kanban intuitivo com drag-and-drop. Veja onde cada venda está e o que fazer pra avançar.",
    cor: "bg-success/10 text-success",
  },
  {
    icone: MessageCircle,
    titulo: "Agente SDR por WhatsApp",
    descricao:
      "Um agente de IA que responde seus leads 24/7 pelo WhatsApp, qualifica e agenda visitas automaticamente.",
    cor: "bg-success/10 text-success",
  },
  {
    icone: Globe,
    titulo: "Site público personalizado",
    descricao:
      "Seu site de imóveis pronto em minutos. Personalize cores, logo, sobre nós — sem precisar de desenvolvedor.",
    cor: "bg-warning/10 text-warning",
  },
  {
    icone: Link2,
    titulo: "Integração com portais",
    descricao:
      "Feed XML automático para portais como ZAP, OLX e VivaReal. Receba leads diretamente na plataforma por webhook.",
    cor: "bg-info/10 text-info",
  },
]

export function SecaoFuncionalidades() {
  return (
    <section id="funcionalidades" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header da seção */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-accent-blue uppercase">
            Funcionalidades
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tudo que você precisa para vender mais
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Do primeiro contato ao fechamento — cada módulo foi pensado pra
            facilitar a rotina do corretor.
          </p>
        </div>

        {/* Grid de cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {funcionalidades.map((feat) => (
            <div
              key={feat.titulo}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-accent-blue/30 hover:shadow-lg hover:shadow-accent-blue/5"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feat.cor} transition-transform duration-300 group-hover:scale-110`}
              >
                <feat.icone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feat.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feat.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
