"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { X, Trash2, ArrowRightLeft, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  excluirNegociosEmMassa,
  moverNegociosParaEtapa,
  ganharNegociosEmMassa,
  perderNegociosEmMassa,
} from "@/actions/negocios"
import { criarClienteBrowser } from "@/lib/supabase/client"

interface BarraAcoesMassaProps {
  selecionados: string[]
  onLimpar: () => void
  onAcaoConcluida: () => void
}

export function BarraAcoesMassa({
  selecionados,
  onLimpar,
  onAcaoConcluida,
}: BarraAcoesMassaProps) {
  const n = selecionados.length

  if (n === 0) return null

  function handleConcluido() {
    onAcaoConcluida()
    onLimpar()
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl border bg-background px-5 py-3 shadow-xl ring-1 ring-foreground/10">
        <span className="min-w-max text-sm font-medium">
          {n} {n !== 1 ? "negócios selecionados" : "negócio selecionado"}
        </span>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <DialogExcluir selecionados={selecionados} onConcluido={handleConcluido} />
          <DialogMoverEtapa selecionados={selecionados} onConcluido={handleConcluido} />
          <DialogGanhar selecionados={selecionados} onConcluido={handleConcluido} />
          <DialogPerder selecionados={selecionados} onConcluido={handleConcluido} />
        </div>

        <div className="h-4 w-px bg-border" />

        <button
          onClick={onLimpar}
          title="Limpar seleção"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Dialog: Excluir
// ============================================================

function DialogExcluir({
  selecionados,
  onConcluido,
}: {
  selecionados: string[]
  onConcluido: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function handleExcluir() {
    setSalvando(true)
    const resultado = await excluirNegociosEmMassa(selecionados)
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setAberto(false)
      onConcluido()
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir negócios</DialogTitle>
          <DialogDescription>
            Tem certeza que quer excluir {selecionados.length}{" "}
            {selecionados.length !== 1 ? "negócios" : "negócio"}? Esta ação não
            pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleExcluir} disabled={salvando}>
            {salvando ? "Excluindo..." : "Confirmar Exclusão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog: Mover para Etapa
// ============================================================

function DialogMoverEtapa({
  selecionados,
  onConcluido,
}: {
  selecionados: string[]
  onConcluido: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [etapaId, setEtapaId] = useState("")
  const [etapas, setEtapas] = useState<{ id: string; nome: string }[]>([])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    async function carregar() {
      try {
        const supabase = criarClienteBrowser()
        const { data } = await supabase
          .from("pipeline_etapas")
          .select("id, nome")
          .order("ordem")
        setEtapas(data || [])
      } catch {
        setEtapas([])
      }
    }
    carregar()
  }, [aberto])

  async function handleMover() {
    if (!etapaId) return
    setSalvando(true)
    const resultado = await moverNegociosParaEtapa(selecionados, etapaId)
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setAberto(false)
      setEtapaId("")
      onConcluido()
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
            Mover etapa
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover para etapa</DialogTitle>
          <DialogDescription>
            Selecione a etapa de destino para{" "}
            {selecionados.length !== 1
              ? `os ${selecionados.length} negócios selecionados`
              : "o negócio selecionado"}
            .
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Etapa de destino</Label>
          <Select value={etapaId} onValueChange={(val) => { if (val) setEtapaId(val) }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma etapa..." />
            </SelectTrigger>
            <SelectContent>
              {etapas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={handleMover} disabled={!etapaId || salvando}>
            {salvando ? "Movendo..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog: Ganhar
// ============================================================

function DialogGanhar({
  selecionados,
  onConcluido,
}: {
  selecionados: string[]
  onConcluido: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function handleGanhar() {
    setSalvando(true)
    const resultado = await ganharNegociosEmMassa(selecionados)
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setAberto(false)
      onConcluido()
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="success" size="sm">
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Ganhar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como ganho</DialogTitle>
          <DialogDescription>
            Confirmar que{" "}
            {selecionados.length !== 1
              ? `os ${selecionados.length} negócios selecionados foram ganhos`
              : "o negócio selecionado foi ganho"}
            ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleGanhar} disabled={salvando}>
            {salvando ? "Salvando..." : "Confirmar Ganho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog: Perder
// ============================================================

function DialogPerder({
  selecionados,
  onConcluido,
}: {
  selecionados: string[]
  onConcluido: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function handlePerder() {
    if (!motivo.trim()) return
    setSalvando(true)
    const resultado = await perderNegociosEmMassa(selecionados, motivo)
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setMotivo("")
      setAberto(false)
      onConcluido()
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Perder
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>
            Informe o motivo da perda para{" "}
            {selecionados.length !== 1
              ? `os ${selecionados.length} negócios`
              : "o negócio"}
            .
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo-massa">Motivo da perda *</Label>
          <Textarea
            id="motivo-massa"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: Cliente desistiu, preço alto, escolheu concorrente..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handlePerder}
            disabled={!motivo.trim() || salvando}
          >
            {salvando ? "Salvando..." : "Confirmar Perda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
