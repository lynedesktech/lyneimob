"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { Organizacao } from "@/types/database"

export function useOrganizacao() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<Organizacao | null>({
    queryKey: ["organizacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizacoes")
        .select("*")
        .single()

      if (error) throw error
      return data
    },
  })

  return {
    organizacao: data ?? null,
    carregando: isLoading,
    erro: error,
  }
}
