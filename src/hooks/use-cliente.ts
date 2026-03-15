"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { ClienteCompleto } from "@/types/database"

export function useCliente(id: string) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<ClienteCompleto | null>({
    queryKey: ["cliente", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*, cliente_interesses(*), cliente_interacoes(*, usuarios(nome))")
        .eq("id", id)
        .order("data", { referencedTable: "cliente_interacoes", ascending: false })
        .single()

      if (error) throw error
      return data as ClienteCompleto
    },
    enabled: !!id,
  })

  return {
    cliente: data ?? null,
    carregando: isLoading,
    erro: error,
  }
}
