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
} from "./negocios"

export {
  labelsStatusLoteamento,
  labelsStatusLote,
  coresStatusLote,
} from "./loteamentos"

/** Converte um Record de labels em array de opções para <Select> */
export function opcoesDeLabels(record: Record<string, string>) {
  return Object.entries(record).map(([value, label]) => ({ value, label }))
}
