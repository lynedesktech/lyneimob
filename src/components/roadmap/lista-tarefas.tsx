"use client"

import { useState } from "react"
import { Search, Trash2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { STATUS_ROADMAP } from "@/types/roadmap"
import type { TarefaRoadmap, StatusRoadmap } from "@/types/roadmap"
import { atualizarStatusTarefa, excluirTarefaRoadmap } from "@/actions/roadmap"

interface ListaTarefasProps {
  tarefas: TarefaRoadmap[]
}

function BadgeStatus({ status }: { status: StatusRoadmap }) {
  const config = STATUS_ROADMAP[status]
  return (
    <Badge variant={config.cor as "success" | "info" | "warning" | "secondary" | "outline"}>
      {config.label}
    </Badge>
  )
}

export function ListaTarefas({ tarefas: tarefasIniciais }: ListaTarefasProps) {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<StatusRoadmap | "todos">("todos")
  const [tarefas, setTarefas] = useState(tarefasIniciais)

  const tarefasFiltradas = tarefas.filter((t) => {
    const matchBusca = t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (t.descricao?.toLowerCase().includes(busca.toLowerCase()) ?? false)
    const matchStatus = filtroStatus === "todos" || t.status === filtroStatus
    return matchBusca && matchStatus
  })

  // Agrupar por status para exibição
  const grupos: { status: StatusRoadmap; label: string; tarefas: TarefaRoadmap[] }[] = [
    { status: "fazendo", label: "Fazendo", tarefas: [] },
    { status: "a_fazer", label: "A Fazer", tarefas: [] },
    { status: "pronto", label: "Pronto", tarefas: [] },
    { status: "concluido", label: "Concluído", tarefas: [] },
    { status: "sugestao", label: "Sugestões", tarefas: [] },
  ]

  for (const t of tarefasFiltradas) {
    const grupo = grupos.find((g) => g.status === t.status)
    if (grupo) grupo.tarefas.push(t)
  }

  async function handleMudarStatus(id: string, novoStatus: StatusRoadmap) {
    const resultado = await atualizarStatusTarefa(id, novoStatus)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success("Status atualizado.")
      setTarefas((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: novoStatus,
                data_conclusao:
                  novoStatus === "concluido"
                    ? new Date().toISOString().split("T")[0]
                    : t.data_conclusao,
              }
            : t
        )
      )
    }
  }

  async function handleExcluir(id: string) {
    const resultado = await excluirTarefaRoadmap(id)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success("Tarefa excluída.")
      setTarefas((prev) => prev.filter((t) => t.id !== id))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base">
            Tarefas ({tarefasFiltradas.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 w-[250px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    {filtroStatus === "todos" ? "Todos" : STATUS_ROADMAP[filtroStatus].label}
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFiltroStatus("todos")}>
                  Todos
                </DropdownMenuItem>
                {Object.entries(STATUS_ROADMAP).map(([key, val]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setFiltroStatus(key as StatusRoadmap)}
                  >
                    {val.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {grupos.filter((g) => g.tarefas.length > 0).map((grupo) => (
          <div key={grupo.status} className="mb-6 last:mb-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              {grupo.label}
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {grupo.tarefas.length}
              </span>
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupo.tarefas.map((tarefa) => (
                  <TableRow key={tarefa.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{tarefa.titulo}</p>
                      {tarefa.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {tarefa.descricao}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button className="cursor-pointer">
                              <BadgeStatus status={tarefa.status} />
                            </button>
                          }
                        />
                        <DropdownMenuContent>
                          {Object.entries(STATUS_ROADMAP).map(([key, val]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => handleMudarStatus(tarefa.id, key as StatusRoadmap)}
                              disabled={key === tarefa.status}
                            >
                              {val.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tarefa.data_conclusao
                        ? new Date(tarefa.data_conclusao + "T00:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluir(tarefa.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}

        {tarefasFiltradas.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma tarefa encontrada.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
