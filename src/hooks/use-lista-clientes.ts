"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { Cliente } from "@/types/database"
import type { FiltrosClientesInput } from "@/types/clientes"

export function useListaClientes(filtros: FiltrosClientesInput) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<{
    clientes: Cliente[]
    total: number
  }>({
    queryKey: ["clientes", filtros],
    queryFn: async () => {
      let query = supabase
        .from("clientes")
        .select("*", { count: "exact" })

      // Filtros dinâmicos
      if (filtros.busca) {
        query = query.or(
          `nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%,cpf_cnpj.ilike.%${filtros.busca}%`
        )
      }
      if (filtros.tipo) {
        query = query.eq("tipo", filtros.tipo)
      }
      if (filtros.origem) {
        query = query.eq("origem", filtros.origem)
      }
      if (filtros.status) {
        query = query.eq("status", filtros.status)
      }

      // Paginação
      const inicio = (filtros.pagina - 1) * filtros.por_pagina
      const fim = inicio + filtros.por_pagina - 1

      query = query
        .order("created_at", { ascending: false })
        .range(inicio, fim)

      const { data, error, count } = await query

      if (error) throw error

      return {
        clientes: (data as Cliente[]) ?? [],
        total: count ?? 0,
      }
    },
  })

  return {
    clientes: data?.clientes ?? [],
    total: data?.total ?? 0,
    carregando: isLoading,
    erro: error,
  }
}
