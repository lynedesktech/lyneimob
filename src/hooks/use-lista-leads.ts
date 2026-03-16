"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { LeadPortalComRelacoes } from "@/types/database"
import type { FiltrosLeadsInput } from "@/types/leads-portais"

export function useListaLeads(filtros: FiltrosLeadsInput) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<{
    leads: LeadPortalComRelacoes[]
    total: number
  }>({
    queryKey: ["leads-portais", filtros],
    queryFn: async () => {
      let query = supabase
        .from("leads_portais")
        .select(
          "*, clientes(id, nome, telefone, email), imoveis(id, titulo, codigo), negocios(id, titulo, status)",
          { count: "exact" }
        )

      // Filtros dinâmicos
      if (filtros.portal) {
        query = query.eq("portal", filtros.portal)
      }
      if (filtros.status) {
        query = query.eq("status", filtros.status)
      }
      if (filtros.busca) {
        query = query.or(
          `nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%`
        )
      }

      // Paginação
      const pagina = filtros.pagina || 1
      const porPagina = filtros.por_pagina || 20
      const inicio = (pagina - 1) * porPagina
      const fim = inicio + porPagina - 1

      query = query
        .order("created_at", { ascending: false })
        .range(inicio, fim)

      const { data, error, count } = await query

      if (error) throw error

      return {
        leads: (data as LeadPortalComRelacoes[]) ?? [],
        total: count ?? 0,
      }
    },
  })

  return {
    leads: data?.leads ?? [],
    total: data?.total ?? 0,
    carregando: isLoading,
    erro: error,
  }
}
