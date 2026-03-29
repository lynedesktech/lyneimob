"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, User, Building2, MapPin, Calendar, Lightbulb, ExternalLink, Pencil, Trophy, XCircle, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InputMonetario } from "@/components/ui/input-monetario"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ganharNegocio, perderNegocio, moverNegocio } from "@/actions/negocios"
import { labelsTipoNegocio } from "@/lib/constantes"
import { formatarPreco, formatarDataCurta } from "@/lib/formatadores"
import { toast } from "sonner"
import type { NegocioComRelacoes, PipelineEtapa } from "@/types/database"

interface KanbanCardProps {
  negocio: NegocioComRelacoes
  etapas?: PipelineEtapa[]
  onMover?: () => void
  overlay?: boolean
}

export function KanbanCard({ negocio, etapas, onMover, overlay }: KanbanCardProps) {
  const router = useRouter()
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

  const [openGanho, setOpenGanho] = useState(false)
  const [openPerda, setOpenPerda] = useState(false)

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
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
                          {negocio.imoveis.codigo_interno} — {negocio.imoveis.titulo}
                        </span>
                      </div>
                    )}

                    {/* Lote */}
                    {negocio.lotes && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {negocio.lotes.loteamentos?.nome} — Q{negocio.lotes.quadra} L{negocio.lotes.numero_lote}
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
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem onSelect={() => router.push(`/negocios/${negocio.id}`)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => router.push(`/negocios/${negocio.id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </ContextMenuItem>

          {etapas && etapas.length > 0 && negocio.status === "aberto" && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <ArrowRight className="mr-2 h-4 w-4" />
                Mover para...
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                {etapas
                  .filter((e) => e.id !== negocio.etapa_id && e.tipo === "normal")
                  .map((etapa) => (
                    <ContextMenuItem
                      key={etapa.id}
                      onSelect={async () => {
                        const res = await moverNegocio(negocio.id, etapa.id, 0)
                        if (res.erro) {
                          toast.error(res.erro)
                        } else {
                          toast.success(`Movido para "${etapa.nome}"`)
                          onMover?.()
                        }
                      }}
                    >
                      <div
                        className="mr-2 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: etapa.cor }}
                      />
                      {etapa.nome}
                    </ContextMenuItem>
                  ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          {negocio.status === "aberto" && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onSelect={() => setOpenGanho(true)}
                className="text-success focus:text-success"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Marcar como Ganho
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={() => setOpenPerda(true)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Marcar como Perdido
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <DialogGanho
        negocioId={negocio.id}
        valorAtual={negocio.valor}
        open={openGanho}
        onOpenChange={setOpenGanho}
      />

      <DialogPerda
        negocioId={negocio.id}
        open={openPerda}
        onOpenChange={setOpenPerda}
      />
    </>
  )
}

// ============================================================
// Dialog Ganhar
// ============================================================

function DialogGanho({
  negocioId,
  valorAtual,
  open,
  onOpenChange,
}: {
  negocioId: string
  valorAtual: number | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [valor, setValor] = useState<number | null>(valorAtual)
  const [salvando, setSalvando] = useState(false)

  async function handleGanhar() {
    setSalvando(true)
    const resultado = await ganharNegocio(negocioId, valor ?? undefined)
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como ganho</DialogTitle>
          <DialogDescription>Confirme o valor final do negócio.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="valor-final-ctx">Valor Final</Label>
          <InputMonetario
            id="valor-final-ctx"
            valor={valor}
            onValorChange={setValor}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGanhar} disabled={salvando} variant="success">
            {salvando ? "Salvando..." : "Confirmar Ganho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog Perder
// ============================================================

function DialogPerda({
  negocioId,
  open,
  onOpenChange,
}: {
  negocioId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [estado, formAction, pendente] = useActionState(perderNegocio, {})

  useEffect(() => {
    if (estado.erro) toast.error(estado.erro)
    if (estado.sucesso) {
      toast.success(estado.sucesso)
      onOpenChange(false)
    }
  }, [estado, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction}>
          <input type="hidden" name="id" value={negocioId} />
          <DialogHeader>
            <DialogTitle>Marcar como perdido</DialogTitle>
            <DialogDescription>
              Informe o motivo da perda para análise futura.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label htmlFor="motivo-perda-ctx">Motivo da perda *</Label>
            <Textarea
              id="motivo-perda-ctx"
              name="motivo_perda"
              placeholder="Ex: Cliente desistiu, preço alto, escolheu concorrente..."
              rows={3}
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={pendente}>
              {pendente ? "Salvando..." : "Confirmar Perda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
