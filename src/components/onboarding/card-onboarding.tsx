"use client"

import type { CardComponentProps } from "onborda"
import { useOnborda } from "onborda"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, X, Check } from "lucide-react"
import { marcarTourCompleto, marcarEtapaChecklist } from "@/actions/onboarding"
import { useQueryClient } from "@tanstack/react-query"
import { TOUR_PARA_ETAPA, TOURS_MANUAIS } from "@/types/onboarding"
import type { ChaveMiniTour } from "@/types/onboarding"

// ============================================================
// Card do tour (usado em todos os mini-tours)
// ============================================================

export function CardOnboarding({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const { closeOnborda, currentTour } = useOnborda()
  const router = useRouter()
  const queryClient = useQueryClient()
  const ehUltimo = currentStep === totalSteps - 1

  const tourAtual = currentTour as ChaveMiniTour | "boas-vindas" | null
  const ehBoasVindas = tourAtual === "boas-vindas"
  const ehTourManual = tourAtual ? TOURS_MANUAIS.includes(tourAtual as ChaveMiniTour) : false

  async function handleNext() {
    if (ehUltimo) {
      if (ehBoasVindas) {
        // Tour de boas-vindas: marcar onboarding_completado
        await marcarTourCompleto()
        queryClient.invalidateQueries({ queryKey: ["onboarding"] })
      } else if (ehTourManual && tourAtual) {
        // Tours manuais: último step marca a etapa no checklist
        const chaveEtapa = TOUR_PARA_ETAPA[tourAtual as ChaveMiniTour]
        if (chaveEtapa) {
          await marcarEtapaChecklist(chaveEtapa)
          queryClient.invalidateQueries({ queryKey: ["onboarding"] })
        }
      }
      // Tours operacionais: apenas fecha (auto-detecção cuida)
      closeOnborda()
      if (ehBoasVindas) router.push("/painel")
      return
    }
    nextStep()
  }

  function handlePular() {
    if (ehBoasVindas) {
      marcarTourCompleto().then(() => {
        queryClient.invalidateQueries({ queryKey: ["onboarding"] })
      })
    }
    closeOnborda()
  }

  // Texto do botão final
  let textoBotaoFinal = "Finalizar!"
  if (ehTourManual) textoBotaoFinal = "Concluído"

  return (
    <div className="relative w-80 rounded-xl border bg-card p-5 shadow-lg">
      {/* Seta apontando pro elemento */}
      {arrow}

      {/* Botão pular/fechar */}
      <button
        onClick={handlePular}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground transition-colors"
        title={ehBoasVindas ? "Pular tour" : "Fechar"}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 pr-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {step.icon}
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {step.title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {currentStep + 1} de {totalSteps}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {step.content}
      </div>

      {/* Barra de progresso dos steps */}
      <div className="mt-4 flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Botões */}
      <div className="mt-4 flex items-center justify-between">
        {currentStep > 0 ? (
          <Button variant="ghost" size="sm" onClick={prevStep}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Anterior
          </Button>
        ) : (
          <div />
        )}

        <Button size="sm" onClick={handleNext}>
          {ehUltimo ? (
            <>
              {ehTourManual && <Check className="mr-1 h-3.5 w-3.5" />}
              {textoBotaoFinal}
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
