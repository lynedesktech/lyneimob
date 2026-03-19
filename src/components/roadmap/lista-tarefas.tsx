"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Trash2, ChevronDown, ChevronRight, X } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { STATUS_ROADMAP, PRIORIDADE_ROADMAP } from "@/types/roadmap"
import type { TarefaRoadmap, StatusRoadmap, PrioridadeRoadmap } from "@/types/roadmap"
import { atualizarStatusTarefa, excluirTarefaRoadmap } from "@/actions/roadmap"

interface ListaTarefasProps {
  tarefas: TarefaRoadmap[]
  superAdmins?: { id: string; nome: string }[]
}

const COR_BORDA: Record<StatusRoadmap, string> = {
  fazendo: "border-l-info",
  a_fazer: "border-l-warning",
  pronto: "border-l-muted-foreground",
  concluido: "border-l-success",
  sugestao: "border-l-accent-blue",
}

export function ListaTarefas({ tarefas: tarefasIniciais, superAdmins = [] }: ListaTarefasProps) {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<StatusRoadmap | "todos">("todos")
  const [filtroPrioridade, setFiltroPrioridade] = useState<PrioridadeRoadmap | "todos">("todos")
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("todos")
  const [filtroVencimento, setFiltroVencimento] = useState<string>("todos")
  const [tarefas, setTarefas] = useState(tarefasIniciais)
  const [processando, setProcessando] = useState<string | null>(null)
  const [abertos, setAbertos] = useState<Record<string, boolean>>({
    fazendo: true,
    a_fazer: true,
    pronto: true,
    concluido: false,
    sugestao: true,
  })

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const tarefasFiltradas = tarefas.filter((t) => {
    const matchBusca = t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (t.descricao?.toLowerCase().includes(busca.toLowerCase()) ?? false)
    const matchStatus = filtroStatus === "todos" || t.status === filtroStatus
    const matchPrioridade = filtroPrioridade === "todos" || t.prioridade === filtroPrioridade
    const matchResponsavel = filtroResponsavel === "todos" ||
      (filtroResponsavel === "__sem__" ? !t.responsavel_id : t.responsavel_id === filtroResponsavel)

    let matchVencimento = true
    if (filtroVencimento === "atrasadas") {
      matchVencimento = !!t.data_vencimento && t.status !== "concluido" &&
        new Date(t.data_vencimento + "T23:59:59") < hoje
    } else if (filtroVencimento === "sem_data") {
      matchVencimento = !t.data_vencimento
    } else if (filtroVencimento === "com_data") {
      matchVencimento = !!t.data_vencimento
    }

    return matchBusca && matchStatus && matchPrioridade && matchResponsavel && matchVencimento
  })

  const temFiltros = filtroStatus !== "todos" || filtroPrioridade !== "todos" ||
    filtroResponsavel !== "todos" || filtroVencimento !== "todos" || busca !== ""

  function limparFiltros() {
    setBusca("")
    setFiltroStatus("todos")
    setFiltroPrioridade("todos")
    setFiltroResponsavel("todos")
    setFiltroVencimento("todos")
  }

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
    setProcessando(id)
    const resultado = await atualizarStatusTarefa(id, novoStatus)
    setProcessando(null)
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
    setProcessando(id)
    const resultado = await excluirTarefaRoadmap(id)
    setProcessando(null)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success("Tarefa excluída.")
      setTarefas((prev) => prev.filter((t) => t.id !== id))
    }
  }

  function toggleGrupo(status: string) {
    setAbertos((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Sprints ({tarefasFiltradas.length})
            </CardTitle>
            {temFiltros && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                <X className="mr-1 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sprint..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Select
              value={filtroStatus}
              onValueChange={(v) => setFiltroStatus(v as StatusRoadmap | "todos")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {Object.entries(STATUS_ROADMAP).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtroPrioridade}
              onValueChange={(v) => setFiltroPrioridade(v as PrioridadeRoadmap | "todos")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as prioridades</SelectItem>
                {Object.entries(PRIORIDADE_ROADMAP).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {superAdmins.length > 0 && (
              <Select
                value={filtroResponsavel}
                onValueChange={(v) => v && setFiltroResponsavel(v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="__sem__">Sem responsável</SelectItem>
                  {superAdmins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={filtroVencimento}
              onValueChange={(v) => v && setFiltroVencimento(v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Vencimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Qualquer data</SelectItem>
                <SelectItem value="atrasadas">Atrasadas</SelectItem>
                <SelectItem value="com_data">Com vencimento</SelectItem>
                <SelectItem value="sem_data">Sem vencimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {grupos.filter((g) => g.tarefas.length > 0).map((grupo) => (
          <Collapsible
            key={grupo.status}
            open={abertos[grupo.status]}
            onOpenChange={() => toggleGrupo(grupo.status)}
            className="mb-6 last:mb-0"
          >
            <div className={`border-l-4 ${COR_BORDA[grupo.status]} pl-3`}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full cursor-pointer py-1 hover:opacity-80">
                {abertos[grupo.status] ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{grupo.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {grupo.tarefas.length}
                </Badge>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sprint</TableHead>
                      <TableHead className="w-[130px]">Status</TableHead>
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead className="w-[60px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupo.tarefas.map((tarefa) => (
                      <TableRow key={tarefa.id}>
                        <TableCell className="overflow-hidden">
                          <Link
                            href={`/admin/roadmap/${tarefa.id}`}
                            className="font-medium text-sm hover:underline hover:text-primary block truncate"
                          >
                            {tarefa.titulo}
                          </Link>
                          {tarefa.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {tarefa.descricao}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tarefa.status}
                            onValueChange={(v) => handleMudarStatus(tarefa.id, v as StatusRoadmap)}
                            disabled={!!processando}
                          >
                            <SelectTrigger
                              size="sm"
                              className={processando === tarefa.id ? "opacity-50" : ""}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_ROADMAP).map(([key, val]) => (
                                <SelectItem key={key} value={key}>
                                  {val.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {tarefa.data_conclusao
                            ? new Date(tarefa.data_conclusao + "T00:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExcluir(tarefa.id)}
                            disabled={!!processando}
                            className={`text-destructive hover:text-destructive ${processando === tarefa.id ? "opacity-50" : ""}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        {tarefasFiltradas.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma sprint encontrada.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
