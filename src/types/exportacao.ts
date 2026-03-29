// ============================================================
// Tipos para exportação de dados (Excel e PDF)
// ============================================================

export type FormatoExportacao = "excel" | "pdf"

export type ModuloExportacao = "imoveis" | "clientes" | "negocios" | "atividades"

/** Definição de uma coluna para exportação */
export type ColunaExportacao = {
  campo: string
  label: string
  formatar?: (valor: unknown) => string
}

/** Configuração do PDF */
export type ConfigPdf = {
  titulo: string
  subtitulo?: string
  orientacao?: "portrait" | "landscape"
}

// ============================================================
// Filtros por módulo (espelham os filtros das listagens)
// ============================================================

export type FiltrosExportacaoImoveis = {
  busca?: string
  tipo?: string
  finalidade?: string
  status?: string
  cidade?: string
  bairro?: string
  canal?: string
}

export type FiltrosExportacaoClientes = {
  busca?: string
  tipo?: string
  origem?: string
  status?: string
}

export type FiltrosExportacaoNegocios = {
  corretor_id?: string
  tipo?: string
  valor_min?: number
  valor_max?: number
  status?: string
}

export type FiltrosExportacaoAtividades = {
  tipo?: string
  status?: string
  prioridade?: string
  usuario_id?: string
  data_vencimento?: string
  data_fim?: string
}
