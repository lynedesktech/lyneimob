"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "@/components/negocios/kanban-card"
import type { EtapaComNegocios } from "@/types/database"

interface KanbanColunaProps {
  etapa: EtapaComNegocios
}

export function KanbanColuna({ etapa }: KanbanColunaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id })

  const totalValor = etapa.negocios.reduce(
    (acc, n) => acc + (n.valor || 0),
    0
  )

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      {/* Header da coluna */}
      <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: etapa.cor }}
          />
          <h3 className="text-sm font-semibold">{etapa.nome}</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {etapa.negocios.length}
          </span>
        </div>
        {totalValor > 0 && (
          <span className="text-xs text-muted-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              notation: "compact",
            }).format(totalValor)}
          </span>
        )}
      </div>

      {/* Cards da coluna */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-transparent"
        }`}
      >
        <SortableContext
          items={etapa.negocios.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          {etapa.negocios.map((negocio) => (
            <KanbanCard key={negocio.id} negocio={negocio} />
          ))}
        </SortableContext>

        {etapa.negocios.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Arraste negócios aqui
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
