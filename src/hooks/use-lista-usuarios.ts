"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { Usuario } from "@/types/database"

export function useListaUsuarios() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error, refetch } = useQuery<{
    usuarios: Usuario[]
  }>({
    queryKey: ["usuarios-equipe"],
    queryFn: async () => {
      // Buscar usuarios da org (RLS filtra automaticamente)
      const { data: usuarios, error: erroUsuarios } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: true })

      if (erroUsuarios) throw erroUsuarios

      return {
        usuarios: (usuarios as Usuario[]) ?? [],
      }
    },
  })

  return {
    usuarios: data?.usuarios ?? [],
    carregando: isLoading,
    erro: error,
    recarregar: refetch,
  }
}
