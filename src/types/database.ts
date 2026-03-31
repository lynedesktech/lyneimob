import type { ConfiguracoesSite } from "./configuracoes-site"
import type { ConfiguracoesIntegracoes } from "./configuracoes-integracoes"
import type { ConfigDistribuicao } from "./distribuicao-leads"
import {
  TIPOS_IMOVEL,
  FINALIDADES_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_CLIENTE,
  ORIGENS_CLIENTE,
  STATUS_CLIENTE,
  TIPOS_INTERACAO,
  TIPOS_NEGOCIO,
  STATUS_NEGOCIO,
  STATUS_ATIVIDADE,
  PRIORIDADES_ATIVIDADE,
  STATUS_LOTEAMENTO,
  STATUS_LOTE,
} from "@/lib/constantes/enums"

export type Organizacao = {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  telefone: string | null
  email: string | null
  endereco: Record<string, unknown> | null
  creci: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plano: "trial" | "crm_ia" | "crm_ia_sdr"
  plano_status: "active" | "past_due" | "canceled" | "trialing"
  limites: {
    max_corretores: number
    max_imoveis: number
    max_conversas_ia_mes: number
  }
  configuracoes_site: ConfiguracoesSite
  configuracoes_ia: Record<string, unknown>
  configuracoes_integracoes: ConfiguracoesIntegracoes
  config_distribuicao: ConfigDistribuicao
  trial_fim_em: string | null
  whatsapp_numero: string | null
  whatsapp_token: string | null
  created_at: string
  updated_at: string
}

export type PerfilPlataforma = "super_admin" | "desenvolvedor" | "investidor" | null

export type Usuario = {
  id: string
  organizacao_id: string
  nome: string
  email: string
  telefone: string | null
  cargo: "admin" | "corretor" | "gerente"
  avatar_url: string | null
  creci: string | null
  bio: string | null
  ativo: boolean
  super_admin: boolean
  perfil_plataforma: PerfilPlataforma
  created_at: string
}

// ============================================================
// Imóveis
// ============================================================

export type TipoImovel = (typeof TIPOS_IMOVEL)[number]
export type FinalidadeImovel = (typeof FINALIDADES_IMOVEL)[number]
export type StatusImovel = (typeof STATUS_IMOVEL)[number]

export type Imovel = {
  id: string
  organizacao_id: string
  corretor_id: string
  codigo_interno: string
  titulo: string
  descricao: string | null
  tipo: TipoImovel
  finalidade: FinalidadeImovel
  status: StatusImovel
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string
  estado: string
  valor: number | null
  valor_aluguel: number | null
  valor_iptu: number | null
  valor_condominio: number | null
  area_total: number | null
  area_construida: number | null
  quartos: number
  suites: number
  banheiros: number
  vagas: number
  andares: number | null
  observacoes_internas: string | null
  publicar_site: boolean
  publicar_portais: boolean
  titulo_ia: string | null
  descricao_ia: string | null
  created_at: string
  updated_at: string
}

export type ImovelFoto = {
  id: string
  imovel_id: string
  url: string
  descricao: string | null
  ordem: number
  eh_capa: boolean
  created_at: string
}

export type ImovelComFotos = Imovel & {
  imovel_fotos: ImovelFoto[]
}

// ============================================================
// Clientes
// ============================================================

export type TipoCliente = (typeof TIPOS_CLIENTE)[number]
export type OrigemCliente = (typeof ORIGENS_CLIENTE)[number]
export type StatusCliente = (typeof STATUS_CLIENTE)[number]
export type TipoInteracao = (typeof TIPOS_INTERACAO)[number]

export type Cliente = {
  id: string
  organizacao_id: string
  corretor_id: string
  nome: string
  email: string | null
  telefone: string | null
  whatsapp: string | null
  cpf_cnpj: string | null
  tipo: TipoCliente
  origem: OrigemCliente
  status: StatusCliente
  observacoes: string | null
  score_lead: number
  resumo_ia: string | null
  created_at: string
  updated_at: string
}

export type ClienteInteresse = {
  id: string
  cliente_id: string
  tipo_imovel: TipoImovel | null
  finalidade: FinalidadeImovel | null
  bairros_interesse: string[] | null
  cidade: string | null
  estado: string | null
  preco_min: number | null
  preco_max: number | null
  quartos_min: number | null
  area_min: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type ClienteInteracao = {
  id: string
  cliente_id: string
  usuario_id: string
  tipo: TipoInteracao
  descricao: string
  data: string
  created_at: string
}

export type ClienteCompleto = Cliente & {
  cliente_interesses: ClienteInteresse[]
  cliente_interacoes: (ClienteInteracao & { usuarios?: { nome: string } })[]
}

// ============================================================
// Pipeline / Negócios
// ============================================================

export type TipoEtapa = "normal" | "ganho" | "perdido" | "pre_atendimento_ia"

export type StatusNegocio = (typeof STATUS_NEGOCIO)[number]
export type TipoNegocio = (typeof TIPOS_NEGOCIO)[number]

export type PipelineEtapa = {
  id: string
  organizacao_id: string
  nome: string
  cor: string
  icone: string
  ordem: number
  tipo: TipoEtapa
  created_at: string
  updated_at: string
}

export type EtapaComNegocios = PipelineEtapa & {
  negocios: NegocioComRelacoes[]
}

export type Negocio = {
  id: string
  organizacao_id: string
  corretor_id: string
  cliente_id: string
  imovel_id: string | null
  etapa_id: string
  titulo: string
  valor: number | null
  tipo: TipoNegocio
  status: StatusNegocio
  previsao_fechamento: string | null
  data_ganho: string | null
  data_perda: string | null
  motivo_perda: string | null
  posicao: number
  observacoes: string | null
  analise_ia: string | null
  sugestao_ia: string | null
  created_at: string
  updated_at: string
}

export type NegocioComRelacoes = Negocio & {
  clientes: { id: string; nome: string; telefone: string | null; email: string | null } | null
  imoveis: { id: string; titulo: string; codigo_interno: string; tipo: TipoImovel } | null
  lotes?: { id: string; quadra: string; numero_lote: string; unidade: string | null; valor: number | null; loteamento_id: string; loteamentos: { id: string; nome: string } | null } | null
  usuarios: { id: string; nome: string } | null
  pipeline_etapas: { id: string; nome: string; cor: string; icone: string; tipo: TipoEtapa; ordem: number } | null
  sugestao_ia_resumo?: string | null
}

// ============================================================
// Atividades
// ============================================================

// Tipo dinâmico — os slugs vêm da tabela tipos_atividade (não mais hardcoded)
export type TipoAtividade = string

export type TipoAtividadeRegistro = {
  id: string
  organizacao_id: string
  nome: string
  slug: string
  cor: string
  icone: string
  ordem: number
  ativo: boolean
  sistema: boolean
  created_at: string
}

export type StatusAtividade = (typeof STATUS_ATIVIDADE)[number]
export type PrioridadeAtividade = (typeof PRIORIDADES_ATIVIDADE)[number]

export type Atividade = {
  id: string
  organizacao_id: string
  usuario_id: string
  negocio_id: string | null
  cliente_id: string | null
  imovel_id: string | null
  titulo: string
  descricao: string | null
  tipo: TipoAtividade
  status: StatusAtividade
  prioridade: PrioridadeAtividade
  data_vencimento: string
  data_fim: string | null
  data_conclusao: string | null
  lembrete: string | null
  notas_pos_atividade: string | null
  sugestao_ia: string | null
  briefing_ia: string | null
  created_at: string
  updated_at: string
}

export type AtividadeComRelacoes = Atividade & {
  clientes: { id: string; nome: string; telefone: string | null } | null
  imoveis: { id: string; titulo: string; codigo_interno: string } | null
  negocios: { id: string; titulo: string; status: string } | null
  usuarios: { id: string; nome: string } | null
}

// ============================================================
// Leads de Portais
// ============================================================

export type PortalOrigem = "zap" | "olx" | "vivareal" | "imovelweb" | "site" | "whatsapp" | "outro"

export type StatusLead = "novo" | "processado" | "descartado" | "erro"

export type LeadPortal = {
  id: string
  organizacao_id: string
  portal: PortalOrigem
  payload_original: Record<string, unknown> | null
  nome: string | null
  email: string | null
  telefone: string | null
  mensagem: string | null
  imovel_codigo: string | null
  imovel_id: string | null
  cliente_id: string | null
  negocio_id: string | null
  status: StatusLead
  erro_processamento: string | null
  processado_em: string | null
  created_at: string
}

export type LeadPortalComRelacoes = LeadPortal & {
  clientes: { id: string; nome: string; telefone: string | null; email: string | null } | null
  imoveis: { id: string; titulo: string; codigo_interno: string } | null
  negocios: { id: string; titulo: string; status: string } | null
}

// ============================================================
// Loteamentos
// ============================================================

export type Loteamento = {
  id: string
  organizacao_id: string
  nome: string
  descricao: string | null
  descricao_ia: string | null
  status: (typeof STATUS_LOTEAMENTO)[number]
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string
  estado: string
  total_lotes: number
  lotes_disponiveis: number
  lotes_vendidos: number
  lotes_reservados: number
  valor_total: number
  publicar_site: boolean
  observacoes_internas: string | null
  created_at: string
  updated_at: string
}

export type Lote = {
  id: string
  loteamento_id: string
  organizacao_id: string
  quadra: string
  numero_lote: string
  unidade: string
  status: (typeof STATUS_LOTE)[number]
  comprador: string | null
  cliente_id: string | null
  valor: number
  data_venda: string | null
  area: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type LoteComCliente = Lote & {
  cliente: { id: string; nome: string } | null
}

export type LoteamentoFoto = {
  id: string
  loteamento_id: string
  url: string
  descricao: string | null
  ordem: number
  eh_capa: boolean
  created_at: string
}

export type LoteamentoComFotos = Loteamento & {
  loteamento_fotos: LoteamentoFoto[]
}

export type LoteamentoComLotes = Loteamento & {
  lotes: LoteComCliente[]
}

export type LoteamentoCompleto = Loteamento & {
  lotes: LoteComCliente[]
  loteamento_fotos: LoteamentoFoto[]
}

// ============================================================
// WhatsApp — Agente SDR
// ============================================================

// Tipos completos em src/types/whatsapp.ts
// Re-exportando apenas os tipos base para consistência com database.ts
export type { ConfigWhatsapp, ConversaWhatsapp, MensagemWhatsapp, ConversaComMensagens, ConversaComRelacoes } from "./whatsapp"

// ============================================================
// Domínios Customizados
// ============================================================

// Tipos completos em src/types/dominios.ts
export type { DominioCustomizado, StatusDominio } from "./dominios"
