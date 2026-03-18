import { z } from "zod/v4"

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
// Tipo da tarefa do roadmap
// ============================================================

export interface TarefaRoadmap {
  id: string
  titulo: string
  descricao: string | null
  status: StatusRoadmap
  data_conclusao: string | null
  ordem: number
  created_at: string
}

// ============================================================
// Tipo da análise da IA
// ============================================================

export interface AnaliseRoadmap {
  id: string
  conteudo: string
  dados_resumo: ResumoRoadmap
  created_at: string
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

export const schemaTarefaRoadmap = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  status: z.enum(["a_fazer", "fazendo", "pronto", "concluido", "sugestao"]),
  data_conclusao: z.string().optional(),
  ordem: z.number().int().default(0),
})

export type DadosTarefaRoadmap = z.infer<typeof schemaTarefaRoadmap>
