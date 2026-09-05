"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import {
  COLUNAS_ORGANIZACAO_SEGURAS,
  type OrganizacaoSegura,
} from "@/lib/supabase/colunas-seguras"

export function useOrganizacao() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<OrganizacaoSegura | null>({
    queryKey: ["organizacao"],
    queryFn: async () => {
      // Lista explícita em vez de "*": as colunas de credencial não são mais
      // legíveis com o login do usuário (migration 047).
      const { data, error } = await supabase
        .from("organizacoes")
        .select(COLUNAS_ORGANIZACAO_SEGURAS)
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
