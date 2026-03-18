"use client"

import { useState } from "react"
import { FiltrosPipeline } from "./filtros-pipeline"
import { KanbanBoard } from "./kanban-board"
import { BotaoExportar } from "@/components/ui/botao-exportar"
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

  const totalNegocios = etapas.reduce((acc, e) => acc + e.negocios.length, 0)
  const totalValor = etapas.reduce(
    (acc, e) => acc + e.negocios.reduce((a, n) => a + (n.valor || 0), 0),
    0
  )

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {totalNegocios} negócio{totalNegocios !== 1 ? "s" : ""} aberto
          {totalNegocios !== 1 ? "s" : ""}
          {totalValor > 0 && (
            <>
              {" "}
              — Total:{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalValor)}
            </>
          )}
        </p>
        <BotaoExportar
          modulo="negocios"
          filtros={filtros}
          total={totalNegocios}
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
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
