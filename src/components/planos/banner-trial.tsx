"use client"

import Link from "next/link"
import { Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BannerTrialProps {
  diasRestantes: number | null
  expirado: boolean
}

export function BannerTrial({ diasRestantes, expirado }: BannerTrialProps) {
  if (diasRestantes === null) return null

  if (expirado) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            Seu período de teste acabou. Escolha um plano para continuar
            usando o LyneImob.
          </p>
        </div>
        <Button size="sm" variant="destructive" render={<Link href="/financeiro" />}>
          Ver planos
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    )
  }

  if (diasRestantes <= 5) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          <p className="text-sm font-medium text-warning">
            Seu período de teste expira em{" "}
            <strong>
              {diasRestantes} {diasRestantes === 1 ? "dia" : "dias"}
            </strong>
            . Assine um plano para não perder acesso.
          </p>
        </div>
        <Button size="sm" variant="outline" render={<Link href="/financeiro" />}>
          Ver planos
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    )
  }

  return null
}
