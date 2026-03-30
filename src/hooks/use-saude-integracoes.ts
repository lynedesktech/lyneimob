"use client"

import { useQuery } from "@tanstack/react-query"
import type { SaudeIntegracoes } from "@/lib/saude-integracoes"

/**
 * Hook para monitorar saúde das integrações com polling automático.
 * @param intervalo - Intervalo de polling em ms (padrão: 60s)
 */
export function useSaudeIntegracoes(intervalo = 60000) {
  const { data, isLoading, error, refetch } = useQuery<SaudeIntegracoes>({
    queryKey: ["saude-integracoes"],
    queryFn: async () => {
      const resp = await fetch("/api/saude-integracoes")
      if (resp.status === 401 || resp.status === 403) {
        // Sem permissão — retornar null silenciosamente
        return null
      }
      if (!resp.ok) {
        throw new Error("Erro ao verificar saúde das integrações")
      }
      return resp.json()
    },
    refetchInterval: intervalo,
    staleTime: 30000,
    retry: (contagem, erro) => {
      // Não retentar se for erro de permissão
      if (erro instanceof Error && erro.message.includes("permissão")) return false
      return contagem < 2
    },
  })

  return {
    saude: data ?? null,
    carregando: isLoading,
    erro: error,
    verificarAgora: refetch,
  }
}
