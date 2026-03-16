export const labelsTipoAtividade: Record<string, string> = {
  ligacao: "Ligação",
  email: "E-mail",
  visita: "Visita",
  reuniao: "Reunião",
  follow_up: "Follow-up",
  proposta: "Proposta",
  outro: "Outro",
}

export const labelsPrioridade: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
}

export const coresPrioridade: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-info/10 text-info",
  alta: "bg-destructive/10 text-destructive",
}

export const labelsStatusAtividade: Record<string, string> = {
  pendente: "Pendente",
  concluida: "Concluída",
  cancelada: "Cancelada",
}

// Cores por tipo de atividade — variantes para cada visão do calendário
export const coresTipoAtividade: Record<string, string> = {
  ligacao: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  email: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  visita: "bg-green-100 text-green-800 hover:bg-green-200",
  reuniao: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  follow_up: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
  proposta: "bg-rose-100 text-rose-800 hover:bg-rose-200",
  outro: "bg-gray-100 text-gray-800 hover:bg-gray-200",
}

export const coresTipoAtividadeSemanal: Record<string, string> = {
  ligacao: "bg-blue-100 border-blue-300 text-blue-800",
  email: "bg-purple-100 border-purple-300 text-purple-800",
  visita: "bg-green-100 border-green-300 text-green-800",
  reuniao: "bg-amber-100 border-amber-300 text-amber-800",
  follow_up: "bg-cyan-100 border-cyan-300 text-cyan-800",
  proposta: "bg-rose-100 border-rose-300 text-rose-800",
  outro: "bg-gray-100 border-gray-300 text-gray-800",
}

export const coresTipoAtividadeDiaria: Record<string, string> = {
  ligacao: "border-blue-300 bg-blue-50",
  email: "border-purple-300 bg-purple-50",
  visita: "border-green-300 bg-green-50",
  reuniao: "border-amber-300 bg-amber-50",
  follow_up: "border-cyan-300 bg-cyan-50",
  proposta: "border-rose-300 bg-rose-50",
  outro: "border-gray-300 bg-gray-50",
}

import {
  Phone,
  Mail,
  MapPin,
  Users,
  MessageCircle,
  FileText,
  MoreHorizontal,
} from "lucide-react"

export const iconesTipoAtividade: Record<string, React.ElementType> = {
  ligacao: Phone,
  email: Mail,
  visita: MapPin,
  reuniao: Users,
  follow_up: MessageCircle,
  proposta: FileText,
  outro: MoreHorizontal,
}
