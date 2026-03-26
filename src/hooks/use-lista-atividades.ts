"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { AtividadeComRelacoes } from "@/types/database"
import type { FiltrosAtividadesInput } from "@/types/atividades"
import { calcularRange } from "@/lib/paginacao"

export function useListaAtividades(filtros: FiltrosAtividadesInput) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<{
    atividades: AtividadeComRelacoes[]
    total: number
  }>({
    queryKey: ["atividades", filtros],
    queryFn: async () => {
      let query = supabase
        .from("atividades")
        .select(
          "*, clientes(id, nome, telefone), imoveis(id, titulo, codigo), negocios(id, titulo, status)",
          { count: "exact" }
        )

      // Filtros dinâmicos
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
      if (filtros.data_vencimento_inicio) {
        query = query.gte("data_inicio", filtros.data_vencimento_inicio)
      }
      if (filtros.data_vencimento_fim) {
        query = query.lte("data_inicio", filtros.data_vencimento_fim)
      }

      // Paginação
      const pagina = filtros.pagina || 1
      const porPagina = filtros.por_pagina || 20
      const { inicio, fim } = calcularRange(pagina, porPagina)

      query = query
        .order("data_inicio", { ascending: true })
        .range(inicio, fim)

      const { data, error, count } = await query

      if (error) throw error

      return {
        atividades: (data as AtividadeComRelacoes[]) ?? [],
        total: count ?? 0,
      }
    },
  })

  return {
    atividades: data?.atividades ?? [],
    total: data?.total ?? 0,
    carregando: isLoading,
    erro: error,
  }
}
