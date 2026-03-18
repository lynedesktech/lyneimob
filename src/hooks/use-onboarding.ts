"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  buscarProgressoOnboarding,
  marcarTourCompleto,
  marcarEtapaChecklist,
} from "@/actions/onboarding"
import { ITENS_POR_CARGO } from "@/types/onboarding"
import type { ProgressoOnboarding, ChaveEtapaOnboarding } from "@/types/onboarding"
import { useUsuario } from "@/hooks/use-usuario"

export function useOnboarding() {
  const queryClient = useQueryClient()
  const { usuario } = useUsuario()

  const cargo = (usuario?.cargo as "admin" | "gerente" | "corretor") ?? "corretor"
  const itensDoCargoAtual = ITENS_POR_CARGO[cargo] ?? ITENS_POR_CARGO.corretor

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
  const totalEtapas = itensDoCargoAtual.length
  const etapasCompletas = itensDoCargoAtual.filter((chave) => etapas[chave]).length
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
