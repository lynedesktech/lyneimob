"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { Usuario } from "@/types/database"

export function useUsuario() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error } = useQuery<Usuario | null>({
    queryKey: ["usuario"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) throw error
      return data
    },
  })

  return {
    usuario: data ?? null,
    carregando: isLoading,
    erro: error,
  }
}
