"use client"

import Link from "next/link"
import { Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertAction } from "@/components/ui/alert"

interface BannerTrialProps {
  diasRestantes: number | null
  expirado: boolean
}

export function BannerTrial({ diasRestantes, expirado }: BannerTrialProps) {
  if (diasRestantes === null) return null

  if (expirado) {
    return (
      <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
        <Clock />
        <AlertTitle>
          Seu período de teste acabou. Escolha um plano para continuar usando o LyneImob.
        </AlertTitle>
        <AlertAction>
          <Button size="sm" variant="destructive" render={<Link href="/financeiro" />}>
            Ver planos
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  if (diasRestantes <= 5) {
    return (
      <Alert className="border-warning/30 bg-warning/5 text-warning *:[svg]:text-warning">
        <Clock />
        <AlertTitle className="text-warning">
          Seu período de teste expira em{" "}
          <strong>
            {diasRestantes} {diasRestantes === 1 ? "dia" : "dias"}
          </strong>
          . Assine um plano para não perder acesso.
        </AlertTitle>
        <AlertAction>
          <Button size="sm" variant="outline" render={<Link href="/financeiro" />}>
            Ver planos
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  return null
}
