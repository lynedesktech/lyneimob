"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { LayoutDashboard, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToggleVisualizacaoProps {
  visaoAtual: string
}

export function ToggleVisualizacao({ visaoAtual }: ToggleVisualizacaoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function mudarVisao(visao: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("visao", visao)
    router.push(`/negocios?${params.toString()}`)
  }

  const eKanban = visaoAtual === "kanban" || !visaoAtual
  const eLista = visaoAtual === "lista"

  return (
    <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
      <button
        onClick={() => mudarVisao("kanban")}
        title="Visão Kanban"
        className={cn(
          "flex items-center justify-center rounded p-1.5 transition-colors",
          eKanban
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
      </button>
      <button
        onClick={() => mudarVisao("lista")}
        title="Visão Lista"
        className={cn(
          "flex items-center justify-center rounded p-1.5 transition-colors",
          eLista
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  )
}
