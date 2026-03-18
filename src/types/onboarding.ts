// ============================================================
// Tipos do onboarding (tour de boas-vindas + checklist modular)
// ============================================================

import type { ComponentType, SVGProps } from "react"
import {
  Building2,
  MessageCircle,
  Kanban,
  ListTodo,
  UsersRound,
  Route,
  Plug,
  Globe,
  Home,
  UserPlus,
  Handshake,
  CalendarPlus,
} from "lucide-react"

/** Tipo de ícone Lucide */
type IconeLucide = ComponentType<SVGProps<SVGSVGElement>>

/** Chaves possíveis das etapas do checklist */
export type ChaveEtapaOnboarding =
  | "empresa"
  | "whatsapp"
  | "funil"
  | "tipos_atividade"
  | "equipe"
  | "distribuicao"
  | "portais"
  | "meu_site"
  | "imovel"
  | "cliente"
  | "negocio"
  | "atividade"

/** Progresso das etapas armazenado no banco (jsonb) */
export type EtapasOnboarding = Partial<Record<ChaveEtapaOnboarding, boolean>>

/** Estado completo do onboarding de um usuário */
export type ProgressoOnboarding = {
  onboarding_completado: boolean
  onboarding_etapas: EtapasOnboarding
}

/** Nomes dos mini-tours que podem ser disparados pelo checklist */
export type ChaveMiniTour =
  | "tour-empresa"
  | "tour-whatsapp"
  | "tour-funil"
  | "tour-tipos-atividade"
  | "tour-equipe"
  | "tour-distribuicao"
  | "tour-portais"
  | "tour-meu-site"
  | "tour-imovel"
  | "tour-cliente"
  | "tour-negocio"
  | "tour-atividade"

/** Mapa de mini-tour → chave da etapa (para marcação manual) */
export const TOUR_PARA_ETAPA: Record<ChaveMiniTour, ChaveEtapaOnboarding> = {
  "tour-empresa": "empresa",
  "tour-whatsapp": "whatsapp",
  "tour-funil": "funil",
  "tour-tipos-atividade": "tipos_atividade",
  "tour-equipe": "equipe",
  "tour-distribuicao": "distribuicao",
  "tour-portais": "portais",
  "tour-meu-site": "meu_site",
  "tour-imovel": "imovel",
  "tour-cliente": "cliente",
  "tour-negocio": "negocio",
  "tour-atividade": "atividade",
}

/** Tours que usam marcação manual (último step marca a etapa) */
export const TOURS_MANUAIS: ChaveMiniTour[] = [
  "tour-funil",
  "tour-tipos-atividade",
  "tour-distribuicao",
  "tour-portais",
  "tour-meu-site",
]

/** Item individual do checklist exibido no dashboard */
export type ItemChecklist = {
  chave: ChaveEtapaOnboarding
  tour: ChaveMiniTour
  label: string
  descricao: string
  href: string
  icone: IconeLucide
  grupo: "config" | "operacional"
}

/** Cargo do usuário */
type Cargo = "admin" | "gerente" | "corretor"

/** Itens do checklist por cargo */
export const ITENS_CHECKLIST: ItemChecklist[] = [
  // Configurações
  { chave: "empresa", tour: "tour-empresa", label: "Dados da empresa", descricao: "Nome, telefone, CRECI e endereço", href: "/configuracoes/empresa", icone: Building2, grupo: "config" },
  { chave: "whatsapp", tour: "tour-whatsapp", label: "Conectar WhatsApp", descricao: "Configure o número do agente SDR", href: "/configuracoes/whatsapp", icone: MessageCircle, grupo: "config" },
  { chave: "funil", tour: "tour-funil", label: "Funil de vendas", descricao: "Personalize as etapas do pipeline", href: "/configuracoes/pipeline", icone: Kanban, grupo: "config" },
  { chave: "tipos_atividade", tour: "tour-tipos-atividade", label: "Tipos de atividade", descricao: "Categorias de tarefas: ligação, visita, etc.", href: "/configuracoes/tipos-atividade", icone: ListTodo, grupo: "config" },
  { chave: "equipe", tour: "tour-equipe", label: "Convidar equipe", descricao: "Adicione corretores e gerentes", href: "/configuracoes/equipe", icone: UsersRound, grupo: "config" },
  { chave: "distribuicao", tour: "tour-distribuicao", label: "Distribuição de leads", descricao: "Regras de distribuição entre corretores", href: "/configuracoes/distribuicao", icone: Route, grupo: "config" },
  { chave: "portais", tour: "tour-portais", label: "Configurar portais", descricao: "Feed XML e webhooks para OLX, VivaReal", href: "/configuracoes/portais", icone: Plug, grupo: "config" },
  { chave: "meu_site", tour: "tour-meu-site", label: "Configurar meu site", descricao: "Cores, hero, sobre nós e domínio", href: "/configuracoes/meu-site", icone: Globe, grupo: "config" },
  // Operacionais
  { chave: "imovel", tour: "tour-imovel", label: "Cadastrar imóvel", descricao: "Adicione seu primeiro imóvel com fotos e detalhes", href: "/imoveis/novo", icone: Home, grupo: "operacional" },
  { chave: "cliente", tour: "tour-cliente", label: "Cadastrar cliente", descricao: "Registre um comprador ou locatário", href: "/clientes/novo", icone: UserPlus, grupo: "operacional" },
  { chave: "negocio", tour: "tour-negocio", label: "Criar negócio", descricao: "Conecte cliente e imóvel no pipeline", href: "/negocios/novo", icone: Handshake, grupo: "operacional" },
  { chave: "atividade", tour: "tour-atividade", label: "Criar atividade", descricao: "Agende sua primeira tarefa", href: "/atividades", icone: CalendarPlus, grupo: "operacional" },
]

/** Quais itens cada cargo vê no checklist */
export const ITENS_POR_CARGO: Record<Cargo, ChaveEtapaOnboarding[]> = {
  admin: ["empresa", "whatsapp", "funil", "tipos_atividade", "equipe", "distribuicao", "portais", "meu_site", "imovel", "cliente", "negocio"],
  gerente: ["funil", "tipos_atividade", "equipe", "distribuicao", "meu_site", "imovel", "cliente", "negocio"],
  corretor: ["imovel", "cliente", "negocio", "atividade"],
}
