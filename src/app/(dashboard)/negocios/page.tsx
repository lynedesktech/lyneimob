"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/negocios/kanban-board"
import { FiltrosPipeline } from "@/components/negocios/filtros-pipeline"
import { usePipeline } from "@/hooks/use-pipeline"
import { Skeleton } from "@/components/ui/skeleton"

export default function NegociosPage() {
  const [filtros, setFiltros] = useState<{
    corretor_id?: string
    tipo?: string
    valor_min?: number
    valor_max?: number
  }>({})

  const { etapas, carregando, recarregar } = usePipeline(filtros)

  // Contar total de negócios abertos
  const totalNegocios = etapas.reduce((acc, e) => acc + e.negocios.length, 0)
  const totalValor = etapas.reduce(
    (acc, e) => acc + e.negocios.reduce((a, n) => a + (n.valor || 0), 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {totalNegocios} negócio{totalNegocios !== 1 ? "s" : ""} aberto{totalNegocios !== 1 ? "s" : ""}
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
        </div>
        <Button render={<Link href="/negocios/novo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Negócio
        </Button>
      </div>

      {/* Filtros */}
      <FiltrosPipeline filtros={filtros} onChange={setFiltros} />

      {/* Kanban */}
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
