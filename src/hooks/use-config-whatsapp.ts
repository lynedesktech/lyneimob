"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import {
  COLUNAS_CONFIG_WHATSAPP_SEGURAS,
  type ConfigWhatsappSegura,
} from "@/lib/supabase/colunas-seguras"

export function useConfigWhatsapp() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<ConfigWhatsappSegura | null>({
    queryKey: ["config-whatsapp"],
    queryFn: async () => {
      // O token da instância não é mais legível com o login do usuário
      // (migration 047) — por isso a lista explícita de colunas.
      const { data, error } = await supabase
        .from("config_whatsapp")
        .select(COLUNAS_CONFIG_WHATSAPP_SEGURAS)
        .single()

      if (error) {
        // Se não encontrou config, retorna null (não é erro)
        if (error.code === "PGRST116") return null
        throw error
      }

      return data as unknown as ConfigWhatsappSegura
    },
  })

  return {
    config: data ?? null,
    carregando: isLoading,
    erro: error,
  }
}
