"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { ganharNegocio, perderNegocio, reabrirNegocio } from "@/actions/negocios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, RotateCcw } from "lucide-react"
import type { NegocioComRelacoes } from "@/types/database"

interface AcoesNegocioProps {
  negocio: NegocioComRelacoes
}

export function AcoesNegocio({ negocio }: AcoesNegocioProps) {
  if (negocio.status === "ganho") {
    return <BotaoReabrir negocioId={negocio.id} />
  }

  if (negocio.status === "perdido") {
    return (
      <div className="flex gap-2">
        <BotaoReabrir negocioId={negocio.id} />
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <BotaoGanhar negocioId={negocio.id} valorAtual={negocio.valor} />
      <BotaoPerder negocioId={negocio.id} />
    </div>
  )
}

// ============================================================
// Botão Ganhar
// ============================================================

function BotaoGanhar({
  negocioId,
  valorAtual,
}: {
  negocioId: string
  valorAtual: number | null
}) {
  const [aberto, setAberto] = useState(false)
  const [valor, setValor] = useState(valorAtual?.toString() || "")
  const [salvando, setSalvando] = useState(false)

  async function handleGanhar() {
    setSalvando(true)
    const resultado = await ganharNegocio(
      negocioId,
      valor ? Number(valor) : undefined
    )
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setAberto(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="success" size="sm">
            <CheckCircle className="mr-2 h-4 w-4" />
            Ganhar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como ganho</DialogTitle>
          <DialogDescription>
            Confirme o valor final do negócio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="valor-final">Valor Final (R$)</Label>
          <Input
            id="valor-final"
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor do negócio fechado"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGanhar}
            disabled={salvando}
            variant="success"
          >
            {salvando ? "Salvando..." : "Confirmar Ganho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Botão Perder
// ============================================================

function BotaoPerder({ negocioId }: { negocioId: string }) {
  const [aberto, setAberto] = useState(false)
  const [estado, formAction, pendente] = useActionState(perderNegocio, {})

  useEffect(() => {
    if (estado.erro) toast.error(estado.erro)
    if (estado.sucesso) {
      toast.success(estado.sucesso)
      setAberto(false)
    }
  }, [estado])

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <XCircle className="mr-2 h-4 w-4" />
            Perder
          </Button>
        }
      />
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
            <Label htmlFor="motivo_perda">Motivo da perda *</Label>
            <Textarea
              id="motivo_perda"
              name="motivo_perda"
              placeholder="Ex: Cliente desistiu, preço alto, escolheu concorrente..."
              rows={3}
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAberto(false)}
            >
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

// ============================================================
// Botão Reabrir
// ============================================================

function BotaoReabrir({ negocioId }: { negocioId: string }) {
  const [reabrindo, setReabrindo] = useState(false)

  async function handleReabrir() {
    setReabrindo(true)
    const resultado = await reabrirNegocio(negocioId)
    setReabrindo(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReabrir}
      disabled={reabrindo}
    >
      <RotateCcw className="mr-2 h-4 w-4" />
      {reabrindo ? "Reabrindo..." : "Reabrir"}
    </Button>
  )
}
