export {
  TIPOS_IMOVEL,
  FINALIDADES_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_CLIENTE,
  ORIGENS_CLIENTE,
  STATUS_CLIENTE,
  TIPOS_INTERACAO,
  TIPOS_NEGOCIO,
  ETAPAS_NEGOCIO,
  STATUS_NEGOCIO,
  STATUS_ATIVIDADE,
  PRIORIDADES_ATIVIDADE,
  STATUS_LOTEAMENTO,
  STATUS_LOTE,
} from "./enums"

export {
  labelsTipoImovel,
  labelsFinalidade,
  labelsStatusImovel,
} from "./imoveis"

export {
  labelsTipoCliente,
  labelsOrigem,
  labelsStatusCliente,
  labelsTipoInteracao,
} from "./clientes"

export {
  labelsTipoAtividade,
  labelsPrioridade,
  coresPrioridade,
  labelsStatusAtividade,
  coresTipoAtividade,
  coresTipoAtividadeSemanal,
  coresTipoAtividadeDiaria,
  iconesTipoAtividade,
} from "./atividades"

export {
  labelsTipoNegocio,
  labelsStatusNegocio,
  labelsEtapaNegocio,
} from "./negocios"

export {
  labelsStatusLoteamento,
  labelsStatusLote,
  coresStatusLote,
  obterLandingPageLoteamento,
} from "./loteamentos"

/** Converte um Record de labels em array de opções para <Select> */
export function opcoesDeLabels(record: Record<string, string>) {
  return Object.entries(record).map(([value, label]) => ({ value, label }))
}
