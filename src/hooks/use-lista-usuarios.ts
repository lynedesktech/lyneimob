"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { Usuario, ConviteComRelacoes } from "@/types/database"

export function useListaUsuarios() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error, refetch } = useQuery<{
    usuarios: Usuario[]
    convites: ConviteComRelacoes[]
  }>({
    queryKey: ["usuarios-equipe"],
    queryFn: async () => {
      // Buscar usuarios da org (RLS filtra automaticamente)
      const { data: usuarios, error: erroUsuarios } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: true })

      if (erroUsuarios) throw erroUsuarios

      // Buscar convites (vai falhar silenciosamente para nao-admins por causa do RLS)
      const { data: convites } = await supabase
        .from("convites")
        .select("*, usuarios:convidado_por(id, nome)")
        .in("status", ["pendente"])
        .order("created_at", { ascending: false })

      return {
        usuarios: (usuarios as Usuario[]) ?? [],
        convites: (convites as ConviteComRelacoes[]) ?? [],
      }
    },
  })

  return {
    usuarios: data?.usuarios ?? [],
    convites: data?.convites ?? [],
    carregando: isLoading,
    erro: error,
    recarregar: refetch,
  }
}
