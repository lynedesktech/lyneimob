"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { ConfigWhatsapp } from "@/types/whatsapp"

export function useConfigWhatsapp() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<ConfigWhatsapp | null>({
    queryKey: ["config-whatsapp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_whatsapp")
        .select("*")
        .single()

      if (error) {
        // Se não encontrou config, retorna null (não é erro)
        if (error.code === "PGRST116") return null
        throw error
      }

      return data as ConfigWhatsapp
    },
  })

  return {
    config: data ?? null,
    carregando: isLoading,
    erro: error,
  }
}
