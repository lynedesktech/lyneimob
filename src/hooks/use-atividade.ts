"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { AtividadeComRelacoes } from "@/types/database"

export function useAtividade(id: string) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<AtividadeComRelacoes | null>({
    queryKey: ["atividade", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select(
          "*, clientes(id, nome, telefone), imoveis(id, titulo, codigo), negocios(id, titulo, status), usuarios(id, nome)"
        )
        .eq("id", id)
        .single()

      if (error) throw error
      return data as AtividadeComRelacoes
    },
    enabled: !!id,
  })

  return {
    atividade: data ?? null,
    carregando: isLoading,
    erro: error,
  }
}
