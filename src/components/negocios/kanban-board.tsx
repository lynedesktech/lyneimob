"use client"

import { useCallback, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  rectIntersection,
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

  // Ref para acessar o estado mais recente sem depender de closures
  const etapasRef = useRef(etapasLocal)
  etapasRef.current = etapasLocal

  // Atualizar estado local quando props mudam
  if (etapas !== etapasLocal && !negocioArrastando) {
    setEtapasLocal(etapas)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  function encontrarNegocioAtual(id: string) {
    for (const etapa of etapasRef.current) {
      const negocio = etapa.negocios.find((n) => n.id === id)
      if (negocio) return { negocio, etapa }
    }
    return null
  }

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const resultado = encontrarNegocioAtual(event.active.id as string)
      if (resultado) {
        setNegocioArrastando(resultado.negocio)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      const resultadoAtivo = encontrarNegocioAtual(activeId)
      if (!resultadoAtivo) return

      const etapaOrigemId = resultadoAtivo.etapa.id

      // Verificar se o over é uma coluna (etapa) ou um card (negócio)
      let etapaDestinoId: string
      const etapaOver = etapasRef.current.find((e) => e.id === overId)
      if (etapaOver) {
        etapaDestinoId = overId
      } else {
        const resultadoOver = encontrarNegocioAtual(overId)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active } = event
      const activeId = active.id as string

      setNegocioArrastando(null)

      const resultado = encontrarNegocioAtual(activeId)
      if (!resultado) return

      const { etapa } = resultado
      const posicao = etapa.negocios.findIndex((n) => n.id === activeId)

      const res = await moverNegocio(activeId, etapa.id, posicao)
      if (res.erro) {
        toast.error(res.erro)
        onAtualizar()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onAtualizar]
  )

  // Filtrar etapas finais (ganho/perdido) que não têm negócios
  const etapasVisiveis = etapasLocal.filter(
    (e) => e.tipo === "normal" || e.negocios.length > 0
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex max-w-full gap-4 overflow-x-auto pb-4">
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
