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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
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
      router.refresh()
    }
  }

  const statusConfig = STATUS_ROADMAP[status]
  const prioridadeConfig = PRIORIDADE_ROADMAP[prioridade]

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
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
            <div className="space-y-1.5">
              <Label>Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="cursor-pointer">
                      <Badge variant={statusConfig.cor as "success" | "info" | "warning" | "secondary" | "outline"}>
                        {statusConfig.label}
                      </Badge>
                    </button>
                  }
                />
                <DropdownMenuContent>
                  {Object.entries(STATUS_ROADMAP).map(([key, val]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setStatus(key as StatusRoadmap)}
                    >
                      {val.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="cursor-pointer">
                      <Badge variant={prioridadeConfig.cor as "secondary" | "info" | "warning" | "destructive"}>
                        {prioridadeConfig.label}
                      </Badge>
                    </button>
                  }
                />
                <DropdownMenuContent>
                  {Object.entries(PRIORIDADE_ROADMAP).map(([key, val]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setPrioridade(key as PrioridadeRoadmap)}
                    >
                      {val.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
