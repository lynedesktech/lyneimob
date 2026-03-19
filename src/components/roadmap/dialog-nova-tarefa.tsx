"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_ROADMAP, PRIORIDADE_ROADMAP } from "@/types/roadmap"
import type { StatusRoadmap, PrioridadeRoadmap } from "@/types/roadmap"
import { criarTarefaRoadmap } from "@/actions/roadmap"

export function DialogNovaTarefa() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [status, setStatus] = useState<StatusRoadmap>("a_fazer")
  const [prioridade, setPrioridade] = useState<PrioridadeRoadmap>("media")

  function limpar() {
    setTitulo("")
    setDescricao("")
    setStatus("a_fazer")
    setPrioridade("media")
  }

  async function handleCriar() {
    if (!titulo.trim() || titulo.trim().length < 3) {
      toast.error("Título deve ter pelo menos 3 caracteres.")
      return
    }

    setSalvando(true)
    const resultado = await criarTarefaRoadmap({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      status,
      prioridade,
      checklist: [],
      ordem: 0,
    })
    setSalvando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success("Sprint criada.")
      limpar()
      setAberto(false)
      if (resultado.tarefaId) {
        router.push(`/admin/roadmap/${resultado.tarefaId}`)
      } else {
        router.refresh()
      }
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) limpar(); setAberto(open) }}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Sprint
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Sprint</DialogTitle>
          <DialogDescription>
            Adicione uma nova sprint ao roadmap.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ex: Sprint 11 — Módulo Financeiro"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={salvando}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o escopo da sprint..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={salvando}
            />
          </div>

          {/* Status e Prioridade */}
          <div className="flex items-center gap-4">
            <div className="space-y-1.5 flex-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusRoadmap)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_ROADMAP).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex-1">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as PrioridadeRoadmap)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORIDADE_ROADMAP).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCriar}
            disabled={salvando || !titulo.trim()}
          >
            {salvando ? "Criando..." : "Criar Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
