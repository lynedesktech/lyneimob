"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { AtividadeComRelacoes } from "@/types/database"

interface FiltrosCalendario {
  dataInicio: string
  dataFim: string
  tipo?: string
  status?: string
  prioridade?: string
  responsavel_id?: string
}

export function useAtividadesCalendario(filtros: FiltrosCalendario) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<AtividadeComRelacoes[]>({
    queryKey: ["atividades-calendario", filtros],
    queryFn: async () => {
      let query = supabase
        .from("atividades")
        .select(
          "*, clientes(id, nome), imoveis(id, titulo), negocios(id, titulo)"
        )
        .gte("data_vencimento", filtros.dataInicio)
        .lte("data_vencimento", filtros.dataFim)

      if (filtros.tipo) {
        query = query.eq("tipo", filtros.tipo)
      }
      if (filtros.status) {
        query = query.eq("status", filtros.status)
      }
      if (filtros.prioridade) {
        query = query.eq("prioridade", filtros.prioridade)
      }
      if (filtros.responsavel_id) {
        query = query.eq("usuario_id", filtros.responsavel_id)
      }

      query = query.order("data_vencimento", { ascending: true })

      const { data, error } = await query

      if (error) throw error

      return (data as AtividadeComRelacoes[]) ?? []
    },
    enabled: !!filtros.dataInicio && !!filtros.dataFim,
  })

  return {
    atividades: data ?? [],
    carregando: isLoading,
    erro: error,
  }
}
