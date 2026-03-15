"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { NegocioComRelacoes } from "@/types/database"

export function useNegocio(id: string) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<NegocioComRelacoes | null>({
    queryKey: ["negocio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negocios")
        .select(
          "*, clientes(id, nome, telefone, email), imoveis(id, titulo, codigo, tipo), usuarios(id, nome), pipeline_etapas(*)"
        )
        .eq("id", id)
        .single()

      if (error) throw error
      return data as NegocioComRelacoes
    },
    enabled: !!id,
  })

  return {
    negocio: data ?? null,
    carregando: isLoading,
    erro: error,
  }
}
