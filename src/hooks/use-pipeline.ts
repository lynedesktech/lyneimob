"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { EtapaComNegocios, PipelineEtapa } from "@/types/database"

export function usePipeline(filtros?: {
  corretor_id?: string
  tipo?: string
  valor_min?: number
  valor_max?: number
}) {
  const supabase = criarClienteBrowser()

  const { data, isLoading, error, refetch } = useQuery<EtapaComNegocios[]>({
    queryKey: ["pipeline", filtros],
    queryFn: async () => {
      // Buscar etapas ordenadas
      const { data: etapas, error: erroEtapas } = await supabase
        .from("pipeline_etapas")
        .select("*")
        .order("ordem", { ascending: true })

      if (erroEtapas) throw erroEtapas

      // Buscar negócios abertos com relações
      let query = supabase
        .from("negocios")
        .select(
          "*, clientes(id, nome, telefone, email), imoveis(id, titulo, codigo, tipo), usuarios(id, nome)"
        )
        .eq("status", "aberto")
        .order("posicao", { ascending: true })

      if (filtros?.corretor_id) {
        query = query.eq("corretor_id", filtros.corretor_id)
      }
      if (filtros?.tipo) {
        query = query.eq("tipo", filtros.tipo)
      }
      if (filtros?.valor_min) {
        query = query.gte("valor", filtros.valor_min)
      }
      if (filtros?.valor_max) {
        query = query.lte("valor", filtros.valor_max)
      }

      const { data: negocios, error: erroNegocios } = await query

      if (erroNegocios) throw erroNegocios

      // Montar etapas com negócios
      const etapasComNegocios = (etapas as PipelineEtapa[]).map((etapa) => ({
        ...etapa,
        negocios: (negocios || []).filter((n) => n.etapa_id === etapa.id),
      }))

      return etapasComNegocios as EtapaComNegocios[]
    },
  })

  return {
    etapas: data ?? [],
    carregando: isLoading,
    erro: error,
    recarregar: refetch,
  }
}
