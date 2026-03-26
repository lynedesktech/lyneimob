"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { Imovel, ImovelFoto } from "@/types/database"
import type { FiltrosImoveisInput } from "@/types/imoveis"

type ImovelComCapa = Imovel & {
  imovel_fotos: Pick<ImovelFoto, "url" | "eh_capa">[]
}

export function useListaImoveis(filtros: FiltrosImoveisInput) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<{
    imoveis: ImovelComCapa[]
    total: number
  }>({
    queryKey: ["imoveis", filtros],
    queryFn: async () => {
      let query = supabase
        .from("imoveis")
        .select("*", { count: "exact" })

      // Filtros dinâmicos
      if (filtros.busca) {
        query = query.or(
          `titulo.ilike.%${filtros.busca}%,codigo_interno.ilike.%${filtros.busca}%,bairro.ilike.%${filtros.busca}%`
        )
      }
      if (filtros.tipo) {
        query = query.eq("tipo", filtros.tipo)
      }
      if (filtros.finalidade) {
        query = query.eq("finalidade", filtros.finalidade)
      }
      if (filtros.status) {
        query = query.eq("status", filtros.status)
      }
      if (filtros.cidade) {
        query = query.ilike("cidade", `%${filtros.cidade}%`)
      }
      if (filtros.bairro) {
        query = query.ilike("bairro", `%${filtros.bairro}%`)
      }
      if (filtros.preco_min) {
        query = query.gte("valor", filtros.preco_min)
      }
      if (filtros.preco_max) {
        query = query.lte("valor", filtros.preco_max)
      }
      if (filtros.quartos_min) {
        query = query.gte("quartos", filtros.quartos_min)
      }

      // Paginação
      const inicio = (filtros.pagina - 1) * filtros.por_pagina
      const fim = inicio + filtros.por_pagina - 1

      query = query
        .order("criado_em", { ascending: false })
        .range(inicio, fim)

      const { data, error, count } = await query

      if (error) throw error

      return {
        imoveis: (data as ImovelComCapa[]) ?? [],
        total: count ?? 0,
      }
    },
  })

  return {
    imoveis: data?.imoveis ?? [],
    total: data?.total ?? 0,
    carregando: isLoading,
    erro: error,
  }
}
