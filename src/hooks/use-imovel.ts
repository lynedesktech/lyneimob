"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { ImovelComFotos } from "@/types/database"

export function useImovel(id: string) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<ImovelComFotos | null>({
    queryKey: ["imovel", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("*, imovel_fotos(*)")
        .eq("id", id)
        .single()

      if (error) throw error
      return data as ImovelComFotos
    },
    enabled: !!id,
  })

  return {
    imovel: data ?? null,
    carregando: isLoading,
    erro: error,
  }
}
