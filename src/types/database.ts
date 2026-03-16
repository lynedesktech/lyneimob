import type { ConfiguracoesSite } from "./configuracoes-site"
import type { ConfiguracoesIntegracoes } from "./configuracoes-integracoes"
import type { ConfigDistribuicao } from "./distribuicao-leads"

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

export type Usuario = {
  id: string
  organizacao_id: string
  nome: string
  email: string
  telefone: string | null
  cargo: "admin" | "corretor" | "gerente"
  avatar_url: string | null
  creci: string | null
  ativo: boolean
  created_at: string
}

// ============================================================
// Imóveis
// ============================================================

export type TipoImovel =
  | "apartamento"
  | "casa"
  | "terreno"
  | "sala_comercial"
  | "galpao"
  | "cobertura"
  | "kitnet"
  | "fazenda"
  | "sitio"
  | "loja"
  | "outro"

export type FinalidadeImovel = "venda" | "aluguel" | "venda_e_aluguel"

export type StatusImovel =
  | "disponivel"
  | "reservado"
  | "vendido"
  | "alugado"
  | "inativo"

export type Imovel = {
  id: string
  organizacao_id: string
  corretor_id: string
  codigo: string
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
  preco_venda: number | null
  preco_aluguel: number | null
  iptu: number | null
  condominio: number | null
  area_total: number | null
  area_construida: number | null
  quartos: number
  suites: number
  banheiros: number
  vagas_garagem: number
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

export type TipoCliente = "comprador" | "vendedor" | "locatario" | "proprietario"

export type OrigemCliente = "indicacao" | "portal" | "site" | "whatsapp" | "outro"

export type StatusCliente = "ativo" | "inativo" | "negociando" | "fechado"

export type TipoInteracao = "ligacao" | "email" | "visita" | "whatsapp" | "reuniao" | "outro"

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

export type TipoEtapa = "normal" | "ganho" | "perdido"

export type StatusNegocio = "aberto" | "ganho" | "perdido"

export type TipoNegocio = "venda" | "aluguel"

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
  sugestao_ia_resumo: string | null
  created_at: string
  updated_at: string
}

export type NegocioComRelacoes = Negocio & {
  clientes: { id: string; nome: string; telefone: string | null; email: string | null } | null
  imoveis: { id: string; titulo: string; codigo: string; tipo: TipoImovel } | null
  usuarios: { id: string; nome: string } | null
  pipeline_etapas: PipelineEtapa | null
}

export type EtapaComNegocios = PipelineEtapa & {
  negocios: NegocioComRelacoes[]
}

// ============================================================
// Atividades
// ============================================================

export type TipoAtividade = "ligacao" | "email" | "visita" | "reuniao" | "follow_up" | "proposta" | "outro"

export type StatusAtividade = "pendente" | "concluida" | "cancelada"

export type PrioridadeAtividade = "baixa" | "media" | "alta"

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
  data_inicio: string
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
  imoveis: { id: string; titulo: string; codigo: string } | null
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
  imoveis: { id: string; titulo: string; codigo: string } | null
  negocios: { id: string; titulo: string; status: string } | null
}

// ============================================================
// Convites
// ============================================================

export type StatusConvite = "pendente" | "aceito" | "expirado" | "revogado"

export type Convite = {
  id: string
  organizacao_id: string
  convidado_por: string
  email: string
  cargo: "admin" | "corretor" | "gerente"
  token: string
  status: StatusConvite
  expires_at: string
  created_at: string
}

export type ConviteComRelacoes = Convite & {
  usuarios: { id: string; nome: string } | null
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
