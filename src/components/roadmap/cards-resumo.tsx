"use client"

import { CheckCircle2, Clock, ListTodo, Loader2, Lightbulb } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ResumoRoadmap } from "@/types/roadmap"

interface CardsResumoProps {
  resumo: ResumoRoadmap
}

const cards = [
  {
    chave: "total_concluido" as const,
    titulo: "Concluído",
    icone: CheckCircle2,
    cor: "text-success",
    bg: "bg-success/10",
  },
  {
    chave: "total_fazendo" as const,
    titulo: "Fazendo",
    icone: Loader2,
    cor: "text-info",
    bg: "bg-info/10",
  },
  {
    chave: "total_pronto" as const,
    titulo: "Pronto",
    icone: Clock,
    cor: "text-warning",
    bg: "bg-warning/10",
  },
  {
    chave: "total_a_fazer" as const,
    titulo: "A Fazer",
    icone: ListTodo,
    cor: "text-muted-foreground",
    bg: "bg-muted",
  },
  {
    chave: "total_sugestao" as const,
    titulo: "Sugestões",
    icone: Lightbulb,
    cor: "text-accent-blue",
    bg: "bg-accent-blue/10",
  },
]

export function CardsResumo({ resumo }: CardsResumoProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icone = card.icone
        return (
          <Card key={card.chave}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-lg p-2.5 ${card.bg}`}>
                <Icone className={`h-5 w-5 ${card.cor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumo[card.chave]}</p>
                <p className="text-xs text-muted-foreground">{card.titulo}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
