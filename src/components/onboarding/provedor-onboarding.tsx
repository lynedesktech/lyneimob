"use client"

import { useEffect } from "react"
import { OnbordaProvider, Onborda, useOnborda } from "onborda"
import { useOnboarding } from "@/hooks/use-onboarding"
import { useUsuario } from "@/hooks/use-usuario"
import { CardOnboarding } from "@/components/onboarding/card-onboarding"
import { ITENS_POR_CARGO } from "@/types/onboarding"
import type { Step } from "onborda"
import {
  Hand,
  BarChart3,
  CheckCircle2,
  Settings,
  Building2,
  MessageCircle,
  Kanban,
  ListTodo,
  UsersRound,
  Route,
  Plug,
  Globe,
  PenLine,
  Home,
  ClipboardList,
  MapPin,
  Save,
  UserPlus,
  Contact,
  Handshake,
  TrendingUp,
  Plus,
  CalendarPlus,
} from "lucide-react"

type Tour = {
  tour: string
  steps: Step[]
}

// ============================================================
// Tour de boas-vindas (3 steps — todos os perfis)
// ============================================================

const tourBoasVindas: Tour = {
  tour: "boas-vindas",
  steps: [
    {
      icon: <Hand className="h-5 w-5" />,
      title: "Bem-vindo ao LyneImob!",
      content: (
        <>
          Este é o seu menu principal. Aqui você encontra tudo —
          imóveis, clientes, negócios, atividades e configurações.
        </>
      ),
      selector: "#onborda-sidebar-nav",
      side: "right" as const,
      showControls: true,
      pointerPadding: 15,
      pointerRadius: 10,
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Seu painel de controle",
      content: (
        <>
          O dashboard mostra um resumo de tudo: negócios abertos,
          clientes cadastrados, imóveis ativos e atividades do dia.
          Esses números atualizam em tempo real.
        </>
      ),
      selector: "#onborda-dashboard-cards",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Seu mapa de progresso",
      content: (
        <>
          Este checklist vai te acompanhar nos primeiros passos.
          Clique em &quot;Fazer agora&quot; em qualquer tarefa para
          começar um mini-guia passo a passo!
        </>
      ),
      selector: "#onborda-checklist",
      side: "top" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
  ],
}

// ============================================================
// Mini-tours de configuração (2-3 steps cada)
// ============================================================

const tourEmpresa: Tour = {
  tour: "tour-empresa",
  steps: [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Central de Configurações",
      content: (
        <>
          Aqui ficam todas as configurações da sua imobiliária.
          Vamos preencher os dados da empresa — nome, telefone,
          CRECI e endereço.
        </>
      ),
      selector: "#onborda-config-grid",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "Dados da Empresa",
      content: (
        <>
          Clique aqui para acessar o formulário. Essas informações
          aparecem no seu site público e nos documentos.
        </>
      ),
      selector: "#onborda-config-empresa",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      nextRoute: "/configuracoes/empresa",
    },
    {
      icon: <PenLine className="h-5 w-5" />,
      title: "Preencha seus dados",
      content: (
        <>
          Complete o formulário com as informações da sua imobiliária.
          Quando salvar, a etapa será marcada automaticamente no checklist!
        </>
      ),
      selector: "#onborda-form-empresa",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      prevRoute: "/configuracoes",
    },
  ],
}

const tourWhatsapp: Tour = {
  tour: "tour-whatsapp",
  steps: [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      content: (
        <>
          Vamos conectar o WhatsApp da sua imobiliária. Com ele,
          o agente SDR pode atender leads automaticamente.
        </>
      ),
      selector: "#onborda-config-grid",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: "Conectar WhatsApp",
      content: (
        <>
          Configure o número do agente e o token de integração.
          Quando salvar, a etapa será marcada automaticamente!
        </>
      ),
      selector: "#onborda-config-whatsapp",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      nextRoute: "/configuracoes/whatsapp",
    },
  ],
}

const tourFunil: Tour = {
  tour: "tour-funil",
  steps: [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      content: (
        <>
          Vamos personalizar o funil de vendas — as etapas que
          cada negócio percorre do primeiro contato ao fechamento.
        </>
      ),
      selector: "#onborda-config-grid",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <Kanban className="h-5 w-5" />,
      title: "Funil de Vendas",
      content: (
        <>
          Aqui você define nome, cor e ordem das etapas do pipeline.
          Personalize conforme o processo da sua imobiliária.
          Quando terminar, clique em &quot;Concluído&quot; para marcar no checklist.
        </>
      ),
      selector: "#onborda-config-funil",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      nextRoute: "/configuracoes/pipeline",
    },
  ],
}

const tourTiposAtividade: Tour = {
  tour: "tour-tipos-atividade",
  steps: [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      content: (
        <>
          Vamos configurar os tipos de atividade — categorias como
          ligação, visita, reunião, etc.
        </>
      ),
      selector: "#onborda-config-grid",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <ListTodo className="h-5 w-5" />,
      title: "Tipos de Atividade",
      content: (
        <>
          Defina as categorias de tarefas que sua equipe usa no dia a dia.
          Quando terminar, clique em &quot;Concluído&quot; para marcar no checklist.
        </>
      ),
      selector: "#onborda-config-tipos-atividade",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      nextRoute: "/configuracoes/tipos-atividade",
    },
  ],
}

const tourEquipe: Tour = {
  tour: "tour-equipe",
  steps: [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      content: (
        <>
          Vamos adicionar membros à sua equipe — corretores e
          gerentes que vão usar o sistema.
        </>
      ),
      selector: "#onborda-config-grid",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <UsersRound className="h-5 w-5" />,
      title: "Convidar Equipe",
      content: (
        <>
          Envie convites por email para seus corretores e gerentes.
          Quando tiver pelo menos 2 membros, a etapa será marcada automaticamente!
        </>
      ),
      selector: "#onborda-config-equipe",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      nextRoute: "/configuracoes/equipe",
    },
  ],
}

const tourDistribuicao: Tour = {
  tour: "tour-distribuicao",
  steps: [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      content: (
        <>
          Vamos configurar como os leads são distribuídos
          automaticamente entre os corretores da equipe.
        </>
      ),
      selector: "#onborda-config-grid",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <Route className="h-5 w-5" />,
      title: "Distribuição de Leads",
      content: (
        <>
          Defina as regras: round-robin, por região, por tipo de imóvel, etc.
          Quando terminar, clique em &quot;Concluído&quot; para marcar no checklist.
        </>
      ),
      selector: "#onborda-config-distribuicao",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      nextRoute: "/configuracoes/distribuicao",
    },
  ],
}

const tourPortais: Tour = {
  tour: "tour-portais",
  steps: [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      content: (
        <>
          Vamos configurar os portais de anúncio — OLX, VivaReal,
          ZAP Imóveis e outros.
        </>
      ),
      selector: "#onborda-config-grid",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <Plug className="h-5 w-5" />,
      title: "Configurar Portais",
      content: (
        <>
          Configure o feed XML e webhooks para receber leads dos portais.
          Quando terminar, clique em &quot;Concluído&quot; para marcar no checklist.
        </>
      ),
      selector: "#onborda-config-portais",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      nextRoute: "/configuracoes/portais",
    },
  ],
}

const tourMeuSite: Tour = {
  tour: "tour-meu-site",
  steps: [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      content: (
        <>
          Vamos personalizar o site público da sua imobiliária —
          cores, banner, seção &quot;sobre nós&quot; e domínio.
        </>
      ),
      selector: "#onborda-config-grid",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Configurar Meu Site",
      content: (
        <>
          Personalize a aparência do seu site público.
          Quando terminar, clique em &quot;Concluído&quot; para marcar no checklist.
        </>
      ),
      selector: "#onborda-config-meu-site",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
      nextRoute: "/configuracoes/meu-site",
    },
  ],
}

// ============================================================
// Mini-tours operacionais (3-5 steps cada)
// ============================================================

const tourImovel: Tour = {
  tour: "tour-imovel",
  steps: [
    {
      icon: <Home className="h-5 w-5" />,
      title: "Vamos cadastrar um imóvel!",
      content: (
        <>
          Clique em &quot;Imóveis&quot; no menu para acessar a área de imóveis,
          e depois em &quot;Novo imóvel&quot;.
        </>
      ),
      selector: "#onborda-sidebar-nav",
      side: "right" as const,
      showControls: true,
      pointerPadding: 15,
      pointerRadius: 10,
      nextRoute: "/imoveis/novo",
    },
    {
      icon: <PenLine className="h-5 w-5" />,
      title: "Formulário de cadastro",
      content: (
        <>
          Este é o formulário completo. Registre tipo, preço, fotos,
          endereço e muito mais. Vou te mostrar as partes principais.
        </>
      ),
      selector: "#onborda-form-imovel",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      title: "Informações básicas",
      content: (
        <>
          Comece por aqui: código interno, título e descrição.
          O título é o que aparece no seu site e nos portais.
        </>
      ),
      selector: "#onborda-imovel-basico",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Endereço do imóvel",
      content: (
        <>
          Preencha o CEP e os campos completam automaticamente.
          O endereço melhora o match com compradores.
        </>
      ),
      selector: "#onborda-imovel-endereco",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <Save className="h-5 w-5" />,
      title: "Salve o imóvel",
      content: (
        <>
          Preencha os campos e clique aqui para salvar.
          Quando salvar, a etapa será marcada automaticamente no checklist!
        </>
      ),
      selector: "#onborda-imovel-salvar",
      side: "left" as const,
      showControls: true,
      pointerPadding: 20,
      pointerRadius: 10,
    },
  ],
}

const tourCliente: Tour = {
  tour: "tour-cliente",
  steps: [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "Vamos cadastrar um cliente!",
      content: (
        <>
          Clique em &quot;Clientes&quot; no menu para acessar a área de clientes,
          e depois em &quot;Novo cliente&quot;.
        </>
      ),
      selector: "#onborda-sidebar-nav",
      side: "right" as const,
      showControls: true,
      pointerPadding: 15,
      pointerRadius: 10,
      nextRoute: "/clientes/novo",
    },
    {
      icon: <Contact className="h-5 w-5" />,
      title: "Dados do cliente",
      content: (
        <>
          Nome completo é obrigatório. Telefone e email são
          importantes para contato. A origem indica de onde
          veio o cliente — portal, site, indicação, etc.
        </>
      ),
      selector: "#onborda-cliente-dados",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <Save className="h-5 w-5" />,
      title: "Salve o cliente",
      content: (
        <>
          Preencha os dados e clique aqui para salvar.
          Quando salvar, a etapa será marcada automaticamente no checklist!
        </>
      ),
      selector: "#onborda-cliente-salvar",
      side: "left" as const,
      showControls: true,
      pointerPadding: 20,
      pointerRadius: 10,
    },
  ],
}

const tourNegocio: Tour = {
  tour: "tour-negocio",
  steps: [
    {
      icon: <Handshake className="h-5 w-5" />,
      title: "Vamos criar um negócio!",
      content: (
        <>
          Clique em &quot;Negócios&quot; no menu para acessar o pipeline.
          O pipeline mostra todos os negócios organizados por etapa.
        </>
      ),
      selector: "#onborda-sidebar-nav",
      side: "right" as const,
      showControls: true,
      pointerPadding: 15,
      pointerRadius: 10,
      nextRoute: "/negocios",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "O Pipeline de Negócios",
      content: (
        <>
          Cada coluna é uma etapa do processo de venda. Arraste os
          cards para mover entre etapas. Vamos criar o primeiro!
        </>
      ),
      selector: "#onborda-kanban",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
    {
      icon: <Plus className="h-5 w-5" />,
      title: "Criar novo negócio",
      content: (
        <>
          Clique aqui para criar um negócio. Conecte um cliente a um
          imóvel e acompanhe a negociação até o fechamento.
          Quando criar, a etapa será marcada automaticamente!
        </>
      ),
      selector: "#onborda-btn-novo-negocio",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
  ],
}

const tourAtividade: Tour = {
  tour: "tour-atividade",
  steps: [
    {
      icon: <CalendarPlus className="h-5 w-5" />,
      title: "Vamos criar uma atividade!",
      content: (
        <>
          Clique em &quot;Atividades&quot; no menu para acessar sua agenda
          de tarefas — ligações, visitas, reuniões e mais.
        </>
      ),
      selector: "#onborda-sidebar-nav",
      side: "right" as const,
      showControls: true,
      pointerPadding: 15,
      pointerRadius: 10,
      nextRoute: "/atividades",
    },
    {
      icon: <Plus className="h-5 w-5" />,
      title: "Nova atividade",
      content: (
        <>
          Use o botão &quot;Nova atividade&quot; para agendar sua primeira tarefa.
          Quando criar, a etapa será marcada automaticamente no checklist!
        </>
      ),
      selector: "#onborda-btn-nova-atividade",
      side: "bottom" as const,
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 10,
    },
  ],
}

// ============================================================
// Mapa de todos os tours disponíveis
// ============================================================

const TODOS_OS_TOURS: Tour[] = [
  tourBoasVindas,
  tourEmpresa,
  tourWhatsapp,
  tourFunil,
  tourTiposAtividade,
  tourEquipe,
  tourDistribuicao,
  tourPortais,
  tourMeuSite,
  tourImovel,
  tourCliente,
  tourNegocio,
  tourAtividade,
]

// ============================================================
// Componente que dispara o tour de boas-vindas automaticamente
// ============================================================

function DisparadorTour({ tourCompleto, carregando }: { tourCompleto: boolean; carregando: boolean }) {
  const { startOnborda } = useOnborda()

  useEffect(() => {
    if (!carregando && !tourCompleto) {
      const timer = setTimeout(() => {
        startOnborda("boas-vindas")
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [carregando, tourCompleto, startOnborda])

  return null
}

// ============================================================
// Provedor principal
// ============================================================

export function ProvedorOnboarding({ children }: { children: React.ReactNode }) {
  const { tourCompleto, carregando } = useOnboarding()
  const { usuario, carregando: carregandoUsuario } = useUsuario()

  // Super admin não precisa de onboarding, mas precisa do provider
  // porque componentes filhos (ChecklistOnboarding) usam useOnborda()
  if (usuario?.perfil_plataforma || usuario?.super_admin) {
    return (
      <OnbordaProvider>
        <Onborda steps={[]} shadowRgb="0,0,0" shadowOpacity="0.6" cardComponent={CardOnboarding}>
          {children}
        </Onborda>
      </OnbordaProvider>
    )
  }

  const cargo = (usuario?.cargo as "admin" | "gerente" | "corretor") ?? "corretor"
  const chavesDoCargoAtual = ITENS_POR_CARGO[cargo] ?? ITENS_POR_CARGO.corretor

  // Filtrar tours: boas-vindas + mini-tours das etapas do cargo
  const toursAtivos = TODOS_OS_TOURS.filter((t) => {
    if (t.tour === "boas-vindas") return true
    // Extrair chave da etapa a partir do nome do tour (ex: "tour-empresa" → "empresa")
    const chaveEtapa = t.tour.replace("tour-", "").replace("-", "_")
    return chavesDoCargoAtual.includes(chaveEtapa as never)
  })

  return (
    <OnbordaProvider>
      <Onborda
        steps={toursAtivos}
        shadowRgb="0,0,0"
        shadowOpacity="0.6"
        cardComponent={CardOnboarding}
        cardTransition={{ duration: 0.3, type: "tween" }}
      >
        <DisparadorTour
          tourCompleto={tourCompleto}
          carregando={carregando || carregandoUsuario}
        />
        {children}
      </Onborda>
    </OnbordaProvider>
  )
}
