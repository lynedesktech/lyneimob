import { z } from "zod"

// ============================================================
// Status possíveis de uma tarefa no roadmap
// ============================================================

export const STATUS_ROADMAP = {
  a_fazer: { label: "A Fazer", cor: "warning" },
  fazendo: { label: "Fazendo", cor: "info" },
  pronto: { label: "Pronto", cor: "secondary" },
  concluido: { label: "Concluído", cor: "success" },
  sugestao: { label: "Sugestão", cor: "outline" },
} as const

export type StatusRoadmap = keyof typeof STATUS_ROADMAP

// ============================================================
// Prioridades possíveis
// ============================================================

export const PRIORIDADE_ROADMAP = {
  baixa: { label: "Baixa", cor: "secondary" },
  media: { label: "Média", cor: "info" },
  alta: { label: "Alta", cor: "warning" },
  critica: { label: "Crítica", cor: "destructive" },
} as const

export type PrioridadeRoadmap = keyof typeof PRIORIDADE_ROADMAP

// ============================================================
// Item do checklist
// ============================================================

export interface ItemChecklist {
  texto: string
  concluido: boolean
}

// ============================================================
// Tipo da tarefa do roadmap
// ============================================================

export interface TarefaRoadmap {
  id: string
  titulo: string
  descricao: string | null
  status: StatusRoadmap
  prioridade: PrioridadeRoadmap
  checklist: ItemChecklist[]
  data_conclusao: string | null
  data_vencimento: string | null
  responsavel_id: string | null
  ordem: number
  created_at: string
}

// ============================================================
// Histórico de mudanças
// ============================================================

export type TipoMudancaRoadmap =
  | "status" | "prioridade" | "checklist" | "titulo"
  | "descricao" | "responsavel" | "vencimento" | "criacao" | "exclusao"

export interface HistoricoTarefaRoadmap {
  id: string
  tarefa_id: string
  usuario_id: string
  tipo: TipoMudancaRoadmap
  valor_anterior: string | null
  valor_novo: string | null
  descricao: string
  created_at: string
  usuario_nome?: string
}

export interface ResumoRoadmap {
  total_a_fazer: number
  total_fazendo: number
  total_pronto: number
  total_concluido: number
  total_sugestao: number
  total_geral: number
}

// ============================================================
// Schema para criar/editar tarefa
// ============================================================

export const schemaItemChecklist = z.object({
  texto: z.string().min(1, "Texto do item não pode ser vazio"),
  concluido: z.boolean().default(false),
})

export const schemaTarefaRoadmap = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  status: z.enum(["a_fazer", "fazendo", "pronto", "concluido", "sugestao"]),
  prioridade: z.enum(["baixa", "media", "alta", "critica"]).default("media"),
  checklist: z.array(schemaItemChecklist).default([]),
  data_conclusao: z.string().optional(),
  data_vencimento: z.string().optional(),
  responsavel_id: z.string().uuid().optional(),
  ordem: z.number().int().default(0),
})

export type DadosTarefaRoadmap = z.infer<typeof schemaTarefaRoadmap>
