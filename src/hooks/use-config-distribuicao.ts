"use client"

import { useQuery } from "@tanstack/react-query"
import { buscarConfigDistribuicao } from "@/actions/distribuicao-leads"

export function useConfigDistribuicao() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["config-distribuicao"],
    queryFn: () => buscarConfigDistribuicao(),
  })

  return {
    config: data?.config || null,
    corretores: data?.corretores || [],
    carregando: isLoading,
    erro: error,
    recarregar: refetch,
  }
}
