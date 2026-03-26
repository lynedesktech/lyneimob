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

  const { etapas, carregando, erro, recarregar } = usePipeline(filtros)

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
      ) : erro ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">
            Erro ao carregar pipeline: {erro instanceof Error ? erro.message : "Erro desconhecido"}
          </p>
          <button
            onClick={() => recarregar()}
            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Tentar novamente
          </button>
        </div>
      ) : etapas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma etapa configurada no pipeline. Vá em Configurações &gt; Pipeline para criar as etapas.
          </p>
        </div>
      ) : (
        <KanbanBoard etapas={etapas} onAtualizar={recarregar} />
      )}
    </div>
  )
}
