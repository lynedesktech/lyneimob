"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { TipoAtividadeRegistro } from "@/types/database"

export function useTiposAtividade() {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error, refetch } = useQuery<TipoAtividadeRegistro[]>({
    queryKey: ["tipos-atividade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_atividade")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true })

      if (error) throw error
      return (data as TipoAtividadeRegistro[]) ?? []
    },
    staleTime: 5 * 60 * 1000, // cache por 5 minutos
  })

  // Mapa de slug → tipo (para lookup rápido por slug)
  const tiposPorSlug = (data ?? []).reduce(
    (acc, t) => ({ ...acc, [t.slug]: t }),
    {} as Record<string, TipoAtividadeRegistro>
  )

  function labelDoTipo(slug: string): string {
    return tiposPorSlug[slug]?.nome ?? slug
  }

  function corDoTipo(slug: string): string {
    return tiposPorSlug[slug]?.cor ?? "#6b7280"
  }

  return {
    tipos: data ?? [],
    tiposPorSlug,
    labelDoTipo,
    corDoTipo,
    carregando: isLoading,
    erro: error,
    recarregar: refetch,
  }
}
