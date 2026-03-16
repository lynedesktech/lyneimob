// ============================================================
// Tipos do módulo de Resumo Semanal
// ============================================================

export interface MetricasSemanais {
  negocios: {
    criados: number
    ganhos: number
    perdidos: number
    valorGanho: number
  }
  clientes: {
    novos: number
    total: number
  }
  imoveis: {
    cadastrados: number
    vendidos: number
    alugados: number
  }
  atividades: {
    concluidas: number
    vencidas: number
    pendentes: number
  }
}

export interface ResumoSemanal {
  id: string
  organizacao_id: string
  semana_inicio: string
  semana_fim: string
  metricas: MetricasSemanais
  conteudo: string
  created_at: string
}
