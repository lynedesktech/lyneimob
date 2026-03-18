"use client"

import { useCallback, useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { toast } from "sonner"
import { moverNegocio } from "@/actions/negocios"
import { KanbanColuna } from "@/components/negocios/kanban-coluna"
import { KanbanCard } from "@/components/negocios/kanban-card"
import type { EtapaComNegocios, NegocioComRelacoes } from "@/types/database"

interface KanbanBoardProps {
  etapas: EtapaComNegocios[]
  onAtualizar: () => void
}

export function KanbanBoard({ etapas, onAtualizar }: KanbanBoardProps) {
  const [etapasLocal, setEtapasLocal] = useState(etapas)
  const [negocioArrastando, setNegocioArrastando] =
    useState<NegocioComRelacoes | null>(null)

  // Atualizar estado local quando props mudam
  if (etapas !== etapasLocal && !negocioArrastando) {
    setEtapasLocal(etapas)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const encontrarNegocio = useCallback(
    (id: string) => {
      for (const etapa of etapasLocal) {
        const negocio = etapa.negocios.find((n) => n.id === id)
        if (negocio) return { negocio, etapa }
      }
      return null
    },
    [etapasLocal]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const resultado = encontrarNegocio(event.active.id as string)
      if (resultado) {
        setNegocioArrastando(resultado.negocio)
      }
    },
    [encontrarNegocio]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      const resultadoAtivo = encontrarNegocio(activeId)
      if (!resultadoAtivo) return

      const etapaOrigemId = resultadoAtivo.etapa.id

      // Verificar se o over é uma coluna (etapa) ou um card (negócio)
      let etapaDestinoId: string
      const etapaOver = etapasLocal.find((e) => e.id === overId)
      if (etapaOver) {
        etapaDestinoId = overId
      } else {
        const resultadoOver = encontrarNegocio(overId)
        if (!resultadoOver) return
        etapaDestinoId = resultadoOver.etapa.id
      }

      if (etapaOrigemId === etapaDestinoId) return

      // Mover visualmente entre colunas
      setEtapasLocal((prev) =>
        prev.map((etapa) => {
          if (etapa.id === etapaOrigemId) {
            return {
              ...etapa,
              negocios: etapa.negocios.filter((n) => n.id !== activeId),
            }
          }
          if (etapa.id === etapaDestinoId) {
            return {
              ...etapa,
              negocios: [
                ...etapa.negocios,
                { ...resultadoAtivo.negocio, etapa_id: etapaDestinoId },
              ],
            }
          }
          return etapa
        })
      )
    },
    [encontrarNegocio, etapasLocal]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active } = event
      const activeId = active.id as string

      setNegocioArrastando(null)

      const resultado = encontrarNegocio(activeId)
      if (!resultado) return

      const { etapa } = resultado
      const posicao = etapa.negocios.findIndex((n) => n.id === activeId)

      const res = await moverNegocio(activeId, etapa.id, posicao)
      if (res.erro) {
        toast.error(res.erro)
        onAtualizar()
      }
    },
    [encontrarNegocio, onAtualizar]
  )

  // Filtrar etapas finais (ganho/perdido) que não têm negócios
  const etapasVisiveis = etapasLocal.filter(
    (e) => e.tipo === "normal" || e.negocios.length > 0
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {etapasVisiveis.map((etapa) => (
          <KanbanColuna key={etapa.id} etapa={etapa} todasEtapas={etapasLocal} onMover={onAtualizar} />
        ))}
      </div>

      <DragOverlay>
        {negocioArrastando ? (
          <KanbanCard negocio={negocioArrastando} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
