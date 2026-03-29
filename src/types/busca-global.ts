import type {
  TipoImovel,
  StatusImovel,
  TipoCliente,
  StatusCliente,
  StatusNegocio,
  TipoNegocio,
  TipoAtividade,
  StatusAtividade,
} from "./database"

// ============================================================
// Tipos dos itens retornados pela busca global
// ============================================================

export type ItemBuscaImovel = {
  id: string
  titulo: string
  codigo: string
  tipo: TipoImovel
  status: StatusImovel
  bairro: string | null
  cidade: string
}

export type ItemBuscaCliente = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  tipo: TipoCliente
  status: StatusCliente
}

export type ItemBuscaNegocio = {
  id: string
  titulo: string
  status: StatusNegocio
  tipo: TipoNegocio
  valor: number | null
  clientes: { nome: string } | null
  imoveis: { titulo: string } | null
}

export type ItemBuscaAtividade = {
  id: string
  titulo: string
  tipo: TipoAtividade
  status: StatusAtividade
  data_vencimento: string
}

export type ResultadoBuscaGlobal = {
  imoveis: ItemBuscaImovel[]
  clientes: ItemBuscaCliente[]
  negocios: ItemBuscaNegocio[]
  atividades: ItemBuscaAtividade[]
}
