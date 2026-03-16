"use client"

import { useQuery } from "@tanstack/react-query"
import { buscarGlobal } from "@/actions/busca-global"
import type { ResultadoBuscaGlobal } from "@/types/busca-global"

export function useBuscaGlobal(termo: string) {
  const { data, isLoading, error } = useQuery<ResultadoBuscaGlobal>({
    queryKey: ["busca-global", termo],
    queryFn: () => buscarGlobal(termo),
    enabled: termo.length >= 2,
    staleTime: 30_000,
  })

  const totalResultados =
    (data?.imoveis.length ?? 0) +
    (data?.clientes.length ?? 0) +
    (data?.negocios.length ?? 0) +
    (data?.atividades.length ?? 0)

  return {
    resultados: data ?? { imoveis: [], clientes: [], negocios: [], atividades: [] },
    totalResultados,
    carregando: isLoading,
    erro: error,
  }
}
