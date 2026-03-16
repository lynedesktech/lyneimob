"use client"

import type { CardComponentProps } from "onborda"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { marcarTourCompleto } from "@/actions/onboarding"

export function CardOnboarding({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const ehUltimo = currentStep === totalSteps

  function handleNext() {
    if (ehUltimo) {
      marcarTourCompleto()
    }
    nextStep()
  }

  return (
    <div className="relative w-80 rounded-xl border bg-card p-5 shadow-lg">
      {/* Seta apontando pro elemento */}
      {arrow}

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{step.icon}</span>
          <h3 className="text-sm font-semibold text-foreground">
            {step.title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {currentStep} de {totalSteps}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {step.content}
      </div>

      {/* Barra de progresso mini */}
      <div className="mt-4 flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Botões */}
      <div className="mt-4 flex items-center justify-between">
        {currentStep > 1 ? (
          <Button variant="ghost" size="sm" onClick={prevStep}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Anterior
          </Button>
        ) : (
          <div />
        )}

        <Button size="sm" onClick={handleNext}>
          {ehUltimo ? "Começar!" : "Próximo"}
          {!ehUltimo && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}
