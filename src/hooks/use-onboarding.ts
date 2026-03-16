"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  buscarProgressoOnboarding,
  marcarTourCompleto,
  marcarEtapaChecklist,
} from "@/actions/onboarding"
import type { ProgressoOnboarding, ChaveEtapaOnboarding } from "@/types/onboarding"

export function useOnboarding() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<ProgressoOnboarding | null>({
    queryKey: ["onboarding"],
    queryFn: buscarProgressoOnboarding,
    staleTime: 60_000,
  })

  const mutationTour = useMutation({
    mutationFn: marcarTourCompleto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] })
    },
  })

  const mutationEtapa = useMutation({
    mutationFn: (etapa: ChaveEtapaOnboarding) => marcarEtapaChecklist(etapa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] })
    },
  })

  const etapas = data?.onboarding_etapas ?? {}
  const totalEtapas = 4
  const etapasCompletas = Object.values(etapas).filter(Boolean).length
  const checklistCompleto = etapasCompletas >= totalEtapas

  return {
    tourCompleto: data?.onboarding_completado ?? true,
    etapas,
    etapasCompletas,
    totalEtapas,
    checklistCompleto,
    carregando: isLoading,
    marcarTour: mutationTour.mutate,
    marcarEtapa: mutationEtapa.mutate,
  }
}
