"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { PipelineEtapa } from "@/types/database"

export function usePipelineConfig() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error, refetch } = useQuery<PipelineEtapa[]>({
    queryKey: ["pipeline-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_etapas")
        .select("*")
        .order("ordem", { ascending: true })

      if (error) throw error
      return (data as PipelineEtapa[]) ?? []
    },
  })

  return {
    etapas: data ?? [],
    carregando: isLoading,
    erro: error,
    recarregar: refetch,
  }
}
