"use client"

import { useState } from "react"
import { FiltrosPipeline } from "./filtros-pipeline"
import { KanbanBoard } from "./kanban-board"
import { Skeleton } from "@/components/ui/skeleton"
import { usePipeline } from "@/hooks/use-pipeline"

export function KanbanContainer() {
  const [filtros, setFiltros] = useState<{
    corretor_id?: string
    tipo?: string
    valor_min?: number
    valor_max?: number
  }>({})

  const { etapas, carregando, recarregar } = usePipeline(filtros)

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up">
        <FiltrosPipeline filtros={filtros} onChange={setFiltros} />
      </div>

      {carregando ? (
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-72 flex-shrink-0 space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard etapas={etapas} onAtualizar={recarregar} />
      )}
    </div>
  )
}
