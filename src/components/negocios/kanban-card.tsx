"use client"

import Link from "next/link"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, User, Building2, Calendar, Lightbulb } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { labelsTipoNegocio } from "@/lib/constantes"
import { formatarPreco, formatarDataCurta } from "@/lib/formatadores"
import type { NegocioComRelacoes } from "@/types/database"

interface KanbanCardProps {
  negocio: NegocioComRelacoes
  overlay?: boolean
}

export function KanbanCard({ negocio, overlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: negocio.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "opacity-50" : ""} ${overlay ? "rotate-3 shadow-lg" : ""}`}
    >
      <Card className="cursor-grab border bg-card shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            {/* Grip para arrastar */}
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              {/* Título */}
              <Link
                href={`/negocios/${negocio.id}`}
                className="text-sm font-medium leading-tight hover:underline"
              >
                {negocio.titulo}
              </Link>

              {/* Valor */}
              {negocio.valor && (
                <p className="mt-1 text-sm font-semibold text-primary">
                  {formatarPreco(negocio.valor)}
                </p>
              )}

              {/* Cliente */}
              {negocio.clientes && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate">{negocio.clientes.nome}</span>
                </div>
              )}

              {/* Imóvel */}
              {negocio.imoveis && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">
                    {negocio.imoveis.codigo} — {negocio.imoveis.titulo}
                  </span>
                </div>
              )}

              {/* Sugestão de ação IA */}
              {negocio.sugestao_ia_resumo && (
                <div className="mt-2 flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-1">
                  <Lightbulb className="h-3 w-3 shrink-0 text-warning" />
                  <span className="truncate text-xs text-warning-foreground">
                    {negocio.sugestao_ia_resumo}
                  </span>
                </div>
              )}

              {/* Footer: tipo + previsão */}
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {labelsTipoNegocio[negocio.tipo]}
                </Badge>

                {negocio.previsao_fechamento && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatarDataCurta(negocio.previsao_fechamento)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
