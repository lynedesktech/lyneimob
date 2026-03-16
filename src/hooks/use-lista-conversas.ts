"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { ConversaComRelacoes } from "@/types/whatsapp"
import type { FiltrosConversasInput } from "@/types/whatsapp"

export function useListaConversas(filtros: FiltrosConversasInput) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<{
    conversas: ConversaComRelacoes[]
    total: number
  }>({
    queryKey: ["conversas-whatsapp", filtros],
    queryFn: async () => {
      let query = supabase
        .from("conversas_whatsapp")
        .select(
          "*, clientes(id, nome, telefone, email), negocios(id, titulo, status), usuarios(id, nome)",
          { count: "exact" }
        )

      // Filtros dinâmicos
      if (filtros.status) {
        query = query.eq("status", filtros.status)
      }
      if (filtros.corretor_id) {
        query = query.eq("corretor_id", filtros.corretor_id)
      }
      if (filtros.busca) {
        query = query.or(
          `nome_cliente.ilike.%${filtros.busca}%,numero_cliente.ilike.%${filtros.busca}%`
        )
      }

      // Paginação
      const pagina = filtros.pagina || 1
      const porPagina = filtros.por_pagina || 20
      const inicio = (pagina - 1) * porPagina
      const fim = inicio + porPagina - 1

      query = query
        .order("ultima_mensagem_em", { ascending: false })
        .range(inicio, fim)

      const { data, error, count } = await query

      if (error) throw error

      return {
        conversas: (data as ConversaComRelacoes[]) ?? [],
        total: count ?? 0,
      }
    },
  })

  return {
    conversas: data?.conversas ?? [],
    total: data?.total ?? 0,
    carregando: isLoading,
    erro: error,
  }
}
