import type { StatusImovel, StatusCliente } from "@/types/database"
import type { StatusLoteamento, StatusLote } from "@/types/loteamentos"
import type { ConfigStatusBadge } from "@/components/ui/status-badge"

export const configStatusImovel: ConfigStatusBadge<StatusImovel> = {
  disponivel: { label: "Disponível", variant: "default" },
  reservado: { label: "Reservado", variant: "secondary" },
  vendido: { label: "Vendido", variant: "outline" },
  alugado: { label: "Alugado", variant: "outline" },
  inativo: { label: "Inativo", variant: "destructive" },
}

export const configStatusCliente: ConfigStatusBadge<StatusCliente> = {
  ativo: { label: "Ativo", variant: "default" },
  negociando: { label: "Negociando", variant: "secondary" },
  fechado: { label: "Fechado", variant: "outline" },
  inativo: { label: "Inativo", variant: "destructive" },
}

export const configStatusNegocio: ConfigStatusBadge = {
  aberto: { label: "Aberto", variant: "default" },
  ganho: { label: "Ganho", variant: "success" },
  perdido: { label: "Perdido", variant: "destructive" },
}

export const configStatusAtividade: ConfigStatusBadge = {
  pendente: { label: "Pendente", variant: "default" },
  concluida: { label: "Concluída", variant: "success" },
  cancelada: { label: "Cancelada", variant: "secondary" },
}

export const configPrioridade: ConfigStatusBadge = {
  baixa: { label: "Baixa", variant: "secondary" },
  media: { label: "Média", variant: "info" },
  alta: { label: "Alta", variant: "destructive" },
}

export const configStatusConversa: ConfigStatusBadge = {
  em_andamento: { label: "Em andamento", variant: "info" },
  qualificado: { label: "Qualificado", variant: "warning" },
  encaminhado: { label: "Encaminhado", variant: "success" },
  finalizado: { label: "Finalizado", variant: "secondary" },
  arquivado: { label: "Arquivado", variant: "secondary" },
}

export const configStatusLoteamento: ConfigStatusBadge<StatusLoteamento> = {
  lancamento: { label: "Lançamento", variant: "info" },
  em_vendas: { label: "Em Vendas", variant: "default" },
  esgotado: { label: "Esgotado", variant: "secondary" },
}

export const configStatusLote: ConfigStatusBadge<StatusLote> = {
  disponivel: { label: "Disponível", variant: "success" },
  reservado: { label: "Reservado", variant: "warning" },
  vendido: { label: "Vendido", variant: "outline" },
}

export const configStatusLead: ConfigStatusBadge = {
  novo: { label: "Novo", variant: "info" },
  processado: { label: "Processado", variant: "success" },
  descartado: { label: "Descartado", variant: "secondary" },
  erro: { label: "Erro", variant: "destructive" },
}
