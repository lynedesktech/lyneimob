import {
  Phone,
  Mail,
  MapPin,
  Users,
  MessageCircle,
  FileText,
  MoreHorizontal,
} from "lucide-react"

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

// Cores base por tipo de atividade — paleta única, derivada em variantes
const coresBase = {
  ligacao: { bg100: "bg-blue-100", bg50: "bg-blue-50", text: "text-blue-800", border: "border-blue-300", hover: "hover:bg-blue-200" },
  email: { bg100: "bg-purple-100", bg50: "bg-purple-50", text: "text-purple-800", border: "border-purple-300", hover: "hover:bg-purple-200" },
  visita: { bg100: "bg-green-100", bg50: "bg-green-50", text: "text-green-800", border: "border-green-300", hover: "hover:bg-green-200" },
  reuniao: { bg100: "bg-amber-100", bg50: "bg-amber-50", text: "text-amber-800", border: "border-amber-300", hover: "hover:bg-amber-200" },
  follow_up: { bg100: "bg-cyan-100", bg50: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-300", hover: "hover:bg-cyan-200" },
  proposta: { bg100: "bg-rose-100", bg50: "bg-rose-50", text: "text-rose-800", border: "border-rose-300", hover: "hover:bg-rose-200" },
  outro: { bg100: "bg-gray-100", bg50: "bg-gray-50", text: "text-gray-800", border: "border-gray-300", hover: "hover:bg-gray-200" },
} as const

function derivarCores(fn: (c: typeof coresBase[keyof typeof coresBase]) => string) {
  return Object.fromEntries(
    Object.entries(coresBase).map(([tipo, c]) => [tipo, fn(c)])
  ) as Record<string, string>
}

// Mensal: fundo + texto + hover
export const coresTipoAtividade = derivarCores(c => `${c.bg100} ${c.text} ${c.hover}`)
// Semanal: fundo + borda + texto
export const coresTipoAtividadeSemanal = derivarCores(c => `${c.bg100} ${c.border} ${c.text}`)
// Diária: borda + fundo suave
export const coresTipoAtividadeDiaria = derivarCores(c => `${c.border} ${c.bg50}`)

export const iconesTipoAtividade: Record<string, React.ElementType> = {
  ligacao: Phone,
  email: Mail,
  visita: MapPin,
  reuniao: Users,
  follow_up: MessageCircle,
  proposta: FileText,
  outro: MoreHorizontal,
}
