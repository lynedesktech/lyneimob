"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { LayoutGrid, LayoutDashboard, List, CalendarDays, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface OpcaoVisualizacao {
  valor: string
  titulo: string
  icone: LucideIcon
}

interface ToggleVisualizacaoProps {
  rota: string
  paramNome?: string
  padrao?: string
  opcoes?: OpcaoVisualizacao[]
}

const opcoesCardLista: OpcaoVisualizacao[] = [
  { valor: "cards", titulo: "Visualização em cards", icone: LayoutGrid },
  { valor: "lista", titulo: "Visualização em lista", icone: List },
]

const opcoesKanbanLista: OpcaoVisualizacao[] = [
  { valor: "kanban", titulo: "Visão Kanban", icone: LayoutDashboard },
  { valor: "lista", titulo: "Visão Lista", icone: List },
]

const opcoesListaCalendario: OpcaoVisualizacao[] = [
  { valor: "lista", titulo: "Visão Lista", icone: List },
  { valor: "calendario", titulo: "Visão Calendário", icone: CalendarDays },
]

export { opcoesCardLista, opcoesKanbanLista, opcoesListaCalendario }

export function ToggleVisualizacao({
  rota,
  paramNome = "view",
  padrao = "cards",
  opcoes = opcoesCardLista,
}: ToggleVisualizacaoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modoAtual = searchParams.get(paramNome) ?? padrao

  const alternarModo = useCallback(
    (modo: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(paramNome, modo)
      params.delete("pagina")
      router.push(`${rota}?${params.toString()}`)
    },
    [router, searchParams, paramNome, rota]
  )

  return (
    <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
      {opcoes.map((opcao) => {
        const ativo = modoAtual === opcao.valor
        const Icone = opcao.icone
        return (
          <button
            key={opcao.valor}
            onClick={() => alternarModo(opcao.valor)}
            title={opcao.titulo}
            className={cn(
              "flex items-center justify-center rounded p-1.5 transition-colors",
              ativo
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icone className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
