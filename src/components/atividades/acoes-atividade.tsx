"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  marcarConcluida,
  reagendarAtividade,
  cancelarAtividade,
  reabrirAtividade,
} from "@/actions/atividades"
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
import { CheckCircle, Calendar, XCircle, RotateCcw } from "lucide-react"
import type { AtividadeComRelacoes } from "@/types/database"

interface AcoesAtividadeProps {
  atividade: AtividadeComRelacoes
}

export function AcoesAtividade({ atividade }: AcoesAtividadeProps) {
  if (atividade.status === "concluida") {
    return null
  }

  if (atividade.status === "cancelada") {
    return <BotaoReabrir atividadeId={atividade.id} />
  }

  // Status pendente
  return (
    <div className="flex gap-2">
      <BotaoConcluir atividadeId={atividade.id} />
      <BotaoReagendar
        atividadeId={atividade.id}
        dataAtual={atividade.data_inicio}
        dataFimAtual={atividade.data_fim}
      />
      <BotaoCancelar atividadeId={atividade.id} />
    </div>
  )
}

// ============================================================
// Botão Concluir
// ============================================================

function BotaoConcluir({ atividadeId }: { atividadeId: string }) {
  const [aberto, setAberto] = useState(false)
  const [notas, setNotas] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function handleConcluir() {
    setSalvando(true)
    const resultado = await marcarConcluida(atividadeId, notas || undefined)
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
          <Button variant="default" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Concluir
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir atividade</DialogTitle>
          <DialogDescription>
            Registre o que aconteceu nesta atividade.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="notas">O que aconteceu? (opcional)</Label>
          <Textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ex: Cliente gostou do imóvel, pediu proposta..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConcluir}
            disabled={salvando}
            variant="success"
          >
            {salvando ? "Salvando..." : "Confirmar Conclusão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Botão Reagendar
// ============================================================

function BotaoReagendar({
  atividadeId,
  dataAtual,
  dataFimAtual,
}: {
  atividadeId: string
  dataAtual: string
  dataFimAtual: string | null
}) {
  const [aberto, setAberto] = useState(false)
  const [novaData, setNovaData] = useState(
    new Date(dataAtual).toISOString().slice(0, 16)
  )
  const [novaDataFim, setNovaDataFim] = useState(
    dataFimAtual ? new Date(dataFimAtual).toISOString().slice(0, 16) : ""
  )
  const [salvando, setSalvando] = useState(false)

  async function handleReagendar() {
    setSalvando(true)
    const resultado = await reagendarAtividade(
      atividadeId,
      new Date(novaData).toISOString(),
      novaDataFim ? new Date(novaDataFim).toISOString() : undefined
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
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Reagendar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reagendar atividade</DialogTitle>
          <DialogDescription>
            Escolha a nova data e horário.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nova-data">Nova data e hora *</Label>
            <Input
              id="nova-data"
              type="datetime-local"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nova-data-fim">Término (opcional)</Label>
            <Input
              id="nova-data-fim"
              type="datetime-local"
              value={novaDataFim}
              onChange={(e) => setNovaDataFim(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={handleReagendar} disabled={salvando}>
            {salvando ? "Salvando..." : "Reagendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Botão Cancelar
// ============================================================

function BotaoCancelar({ atividadeId }: { atividadeId: string }) {
  const [cancelando, setCancelando] = useState(false)

  async function handleCancelar() {
    setCancelando(true)
    const resultado = await cancelarAtividade(atividadeId)
    setCancelando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleCancelar}
      disabled={cancelando}
    >
      <XCircle className="mr-2 h-4 w-4" />
      {cancelando ? "Cancelando..." : "Cancelar"}
    </Button>
  )
}

// ============================================================
// Botão Reabrir
// ============================================================

function BotaoReabrir({ atividadeId }: { atividadeId: string }) {
  const [reabrindo, setReabrindo] = useState(false)

  async function handleReabrir() {
    setReabrindo(true)
    const resultado = await reabrirAtividade(atividadeId)
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
