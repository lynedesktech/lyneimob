import type { LucideIcon } from "lucide-react"
import {
  Sparkles,
  Wand2,
  Type,
  TrendingUp,
  FileText,
  Search,
  Brain,
  Lightbulb,
  TrendingDown,
  ClipboardList,
  RefreshCw,
} from "lucide-react"
import type { ModuloIA } from "./contexto-ia"

export type AcaoIA = {
  id: string
  label: string
  descricao: string
  icone: LucideIcon
  /** Função que retorna true se a ação deve aparecer dado o estado da entidade */
  visivel?: (dados: Record<string, unknown>) => boolean
  /** Tipo de resultado: texto simples, JSON estruturado, ou lista */
  tipoResultado: "texto" | "json" | "lista"
}

// ============================================================
// Ações por módulo
// ============================================================

const acoesImovel: AcaoIA[] = [
  {
    id: "gerar-descricao",
    label: "Gerar descrição",
    descricao: "Cria uma descrição profissional para o anúncio do imóvel",
    icone: Sparkles,
    tipoResultado: "texto",
  },
  {
    id: "melhorar-texto",
    label: "Melhorar texto",
    descricao: "Melhora a descrição existente, tornando-a mais atrativa",
    icone: Wand2,
    tipoResultado: "texto",
  },
  {
    id: "gerar-titulo",
    label: "Gerar título",
    descricao: "Cria um título curto e atrativo para o anúncio",
    icone: Type,
    tipoResultado: "texto",
  },
]

const acoesCliente: AcaoIA[] = [
  {
    id: "calcular-score",
    label: "Calcular score",
    descricao: "Pontuação de 0 a 100 baseada no perfil e engajamento do cliente",
    icone: TrendingUp,
    tipoResultado: "json",
  },
  {
    id: "gerar-resumo",
    label: "Gerar resumo",
    descricao: "Análise resumida do perfil do cliente gerada por IA",
    icone: FileText,
    tipoResultado: "texto",
  },
  {
    id: "match-inteligente",
    label: "Match inteligente",
    descricao: "Sugere os melhores imóveis para o perfil do cliente",
    icone: Search,
    tipoResultado: "lista",
  },
]

const acoesNegocio: AcaoIA[] = [
  {
    id: "analisar-contexto",
    label: "Analisar contexto",
    descricao: "Análise estratégica com pontos fortes, riscos e probabilidade de fechamento",
    icone: Brain,
    visivel: (dados) => dados.status !== "perdido",
    tipoResultado: "texto",
  },
  {
    id: "sugerir-acao",
    label: "Sugerir ação",
    descricao: "Sugere a próxima ação concreta com detalhes e script",
    icone: Lightbulb,
    visivel: (dados) => dados.status !== "perdido",
    tipoResultado: "json",
  },
  {
    id: "analisar-perda",
    label: "Analisar perda",
    descricao: "Diagnóstico de por que o negócio foi perdido e como prevenir no futuro",
    icone: TrendingDown,
    visivel: (dados) => dados.status === "perdido",
    tipoResultado: "texto",
  },
]

const acoesAtividade: AcaoIA[] = [
  {
    id: "gerar-briefing",
    label: "Gerar briefing",
    descricao: "Briefing completo de preparação para a atividade",
    icone: ClipboardList,
    visivel: (dados) => dados.status !== "concluida",
    tipoResultado: "texto",
  },
  {
    id: "sugerir-proximo-passo",
    label: "Sugerir próximo passo",
    descricao: "Analisa a atividade concluída e sugere o próximo passo",
    icone: Lightbulb,
    visivel: (dados) => dados.status === "concluida",
    tipoResultado: "texto",
  },
]

const acoesLoteamento: AcaoIA[] = [
  {
    id: "gerar-descricao-loteamento",
    label: "Gerar descrição",
    descricao: "Cria uma descrição profissional para o loteamento",
    icone: Sparkles,
    tipoResultado: "texto",
  },
  {
    id: "melhorar-texto-loteamento",
    label: "Melhorar texto",
    descricao: "Melhora a descrição existente do loteamento",
    icone: Wand2,
    tipoResultado: "texto",
  },
]

const acoesPainel: AcaoIA[] = [
  {
    id: "regenerar-resumo",
    label: "Regenerar resumo semanal",
    descricao: "Gera um novo resumo da semana com análise de desempenho",
    icone: RefreshCw,
    tipoResultado: "texto",
  },
]

// ============================================================
// Mapa módulo → ações
// ============================================================

export const ACOES_POR_MODULO: Record<ModuloIA, AcaoIA[]> = {
  imovel: acoesImovel,
  cliente: acoesCliente,
  negocio: acoesNegocio,
  atividade: acoesAtividade,
  loteamento: acoesLoteamento,
  painel: acoesPainel,
}

/**
 * Retorna as ações visíveis para o módulo e dados atuais.
 */
export function obterAcoesVisiveis(modulo: ModuloIA, dados: Record<string, unknown>): AcaoIA[] {
  const acoes = ACOES_POR_MODULO[modulo] ?? []
  return acoes.filter((acao) => !acao.visivel || acao.visivel(dados))
}
