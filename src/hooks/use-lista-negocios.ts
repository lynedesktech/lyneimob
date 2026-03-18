"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { NegocioComRelacoes } from "@/types/database"

export interface FiltrosListaNegocios {
  busca?: string
  corretor_id?: string
  tipo?: string
  status?: string
  etapa_id?: string
  valor_min?: number
  valor_max?: number
  pagina?: number
  por_pagina?: number
}

export function useListaNegocios(filtros: FiltrosListaNegocios = {}) {
  const supabase = criarClienteBrowser()
  const porPagina = filtros.por_pagina ?? 20
  const pagina = filtros.pagina ?? 1
  const inicio = (pagina - 1) * porPagina
  const fim = inicio + porPagina - 1

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["lista-negocios", filtros],
    queryFn: async () => {
      let query = supabase
        .from("negocios")
        .select(
          "*, clientes(id, nome, telefone, email), imoveis(id, titulo, codigo, tipo), lotes(id, quadra, numero_lote, unidade, valor, loteamento_id, loteamentos(id, nome)), usuarios(id, nome), pipeline_etapas(id, nome, cor, icone, tipo, ordem)",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(inicio, fim)

      if (filtros.status) {
        query = query.eq("status", filtros.status)
      }
      if (filtros.corretor_id) {
        query = query.eq("corretor_id", filtros.corretor_id)
      }
      if (filtros.tipo) {
        query = query.eq("tipo", filtros.tipo)
      }
      if (filtros.etapa_id) {
        query = query.eq("etapa_id", filtros.etapa_id)
      }
      if (filtros.valor_min) {
        query = query.gte("valor", filtros.valor_min)
      }
      if (filtros.valor_max) {
        query = query.lte("valor", filtros.valor_max)
      }
      if (filtros.busca) {
        query = query.ilike("titulo", `%${filtros.busca}%`)
      }

      const { data, count, error } = await query

      if (error) throw error

      return {
        negocios: (data ?? []) as NegocioComRelacoes[],
        total: count ?? 0,
      }
    },
  })

  const total = data?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  return {
    negocios: data?.negocios ?? [],
    total,
    totalPaginas,
    carregando: isLoading,
    erro: error,
    recarregar: refetch,
  }
}
