"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Plus, CheckCircle2, Circle, FileText, ListChecks, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { STATUS_ROADMAP, PRIORIDADE_ROADMAP } from "@/types/roadmap"
import type { TarefaRoadmap, StatusRoadmap, PrioridadeRoadmap } from "@/types/roadmap"
import { atualizarTarefaRoadmap, excluirTarefaRoadmap } from "@/actions/roadmap"

interface DetalheTarefaClienteProps {
  tarefa: TarefaRoadmap
}

export function DetalheTarefaCliente({ tarefa: tarefaInicial }: DetalheTarefaClienteProps) {
  const router = useRouter()
  const [tarefa, setTarefa] = useState(tarefaInicial)
  const [novoItem, setNovoItem] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Estado de edição do título
  const [editandoTitulo, setEditandoTitulo] = useState(false)
  const [tituloTemp, setTituloTemp] = useState(tarefa.titulo)
  const inputTituloRef = useRef<HTMLInputElement>(null)

  // Estado de edição da descrição
  const [editandoDescricao, setEditandoDescricao] = useState(false)
  const [descricaoTemp, setDescricaoTemp] = useState(tarefa.descricao || "")

  async function salvarTitulo() {
    const novoTitulo = tituloTemp.trim()
    if (!novoTitulo || novoTitulo.length < 3) {
      toast.error("Título deve ter pelo menos 3 caracteres.")
      setTituloTemp(tarefa.titulo)
      setEditandoTitulo(false)
      return
    }
    if (novoTitulo === tarefa.titulo) {
      setEditandoTitulo(false)
      return
    }

    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { titulo: novoTitulo })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
      setTituloTemp(tarefa.titulo)
    } else {
      toast.success("Título atualizado.")
      setTarefa((prev) => ({ ...prev, titulo: novoTitulo }))
    }
    setEditandoTitulo(false)
  }

  async function salvarDescricao() {
    const novaDescricao = descricaoTemp.trim() || null
    if (novaDescricao === tarefa.descricao) {
      setEditandoDescricao(false)
      return
    }

    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { descricao: novaDescricao })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
      setDescricaoTemp(tarefa.descricao || "")
    } else {
      toast.success("Descrição atualizada.")
      setTarefa((prev) => ({ ...prev, descricao: novaDescricao }))
    }
    setEditandoDescricao(false)
  }

  async function handleMudarStatus(novoStatus: StatusRoadmap) {
    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { status: novoStatus })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success("Status atualizado.")
      setTarefa((prev) => ({
        ...prev,
        status: novoStatus,
        data_conclusao: novoStatus === "concluido"
          ? new Date().toISOString().split("T")[0]
          : prev.data_conclusao,
      }))
    }
  }

  async function handleMudarPrioridade(novaPrioridade: PrioridadeRoadmap) {
    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { prioridade: novaPrioridade })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success("Prioridade atualizada.")
      setTarefa((prev) => ({ ...prev, prioridade: novaPrioridade }))
    }
  }

  async function handleToggleItem(index: number) {
    const novaChecklist = [...tarefa.checklist]
    novaChecklist[index] = { ...novaChecklist[index], concluido: !novaChecklist[index].concluido }

    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { checklist: novaChecklist })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      setTarefa((prev) => ({ ...prev, checklist: novaChecklist }))
    }
  }

  async function handleAdicionarItem() {
    if (!novoItem.trim()) return

    const novaChecklist = [...tarefa.checklist, { texto: novoItem.trim(), concluido: false }]

    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { checklist: novaChecklist })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      setTarefa((prev) => ({ ...prev, checklist: novaChecklist }))
      setNovoItem("")
    }
  }

  async function handleRemoverItem(index: number) {
    const novaChecklist = tarefa.checklist.filter((_, i) => i !== index)

    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { checklist: novaChecklist })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      setTarefa((prev) => ({ ...prev, checklist: novaChecklist }))
    }
  }

  async function handleExcluir() {
    const resultado = await excluirTarefaRoadmap(tarefa.id)
    if (resultado.erro) {
      return resultado
    }
    toast.success("Tarefa excluída.")
    router.push("/admin/roadmap")
    return resultado
  }

  const totalChecklist = tarefa.checklist.length
  const concluidosChecklist = tarefa.checklist.filter((i) => i.concluido).length
  const statusConfig = STATUS_ROADMAP[tarefa.status]
  const prioridadeConfig = PRIORIDADE_ROADMAP[tarefa.prioridade] ?? PRIORIDADE_ROADMAP.media

  return (
    <div className="space-y-6">
      {/* Header com título editável */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {editandoTitulo ? (
            <Input
              ref={inputTituloRef}
              value={tituloTemp}
              onChange={(e) => setTituloTemp(e.target.value)}
              onBlur={salvarTitulo}
              onKeyDown={(e) => {
                if (e.key === "Enter") salvarTitulo()
                if (e.key === "Escape") {
                  setTituloTemp(tarefa.titulo)
                  setEditandoTitulo(false)
                }
              }}
              disabled={salvando}
              className="text-2xl font-bold h-auto py-1 max-w-lg"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setTituloTemp(tarefa.titulo)
                setEditandoTitulo(true)
              }}
              className="group flex items-center gap-2 cursor-pointer text-left"
            >
              <h1 className="text-2xl font-bold tracking-tight">{tarefa.titulo}</h1>
              <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <Badge variant={statusConfig.cor as "success" | "info" | "warning" | "secondary" | "outline"}>
            {statusConfig.label}
          </Badge>
          <Badge variant={prioridadeConfig.cor as "secondary" | "info" | "warning" | "destructive"}>
            {prioridadeConfig.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Criada em{" "}
          {new Date(tarefa.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          {tarefa.data_conclusao && (
            <>
              {" · Concluída em "}
              {new Date(tarefa.data_conclusao + "T00:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição editável */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Descrição
                {!editandoDescricao && (
                  <button
                    onClick={() => {
                      setDescricaoTemp(tarefa.descricao || "")
                      setEditandoDescricao(true)
                    }}
                    className="cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editandoDescricao ? (
                <div className="space-y-2">
                  <Textarea
                    value={descricaoTemp}
                    onChange={(e) => setDescricaoTemp(e.target.value)}
                    placeholder="Descreva a sprint..."
                    disabled={salvando}
                    className="min-h-32"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDescricaoTemp(tarefa.descricao || "")
                        setEditandoDescricao(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={salvarDescricao}
                      disabled={salvando}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : tarefa.descricao ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {tarefa.descricao.split("\n").map((p, i) => (
                    <p key={i} className="text-sm text-foreground leading-relaxed">
                      {p || <br />}
                    </p>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setDescricaoTemp("")
                    setEditandoDescricao(true)
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  Clique para adicionar uma descrição...
                </button>
              )}
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                  Checklist
                  {totalChecklist > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({concluidosChecklist}/{totalChecklist})
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progresso */}
              {totalChecklist > 0 && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-success h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(concluidosChecklist / totalChecklist) * 100}%` }}
                  />
                </div>
              )}

              {/* Itens */}
              {tarefa.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <button
                    onClick={() => handleToggleItem(index)}
                    disabled={salvando}
                    className="cursor-pointer shrink-0"
                  >
                    {item.concluido ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${item.concluido ? "line-through text-muted-foreground" : ""}`}>
                    {item.texto}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoverItem(index)}
                    disabled={salvando}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* Adicionar item */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Adicionar item..."
                  value={novoItem}
                  onChange={(e) => setNovoItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdicionarItem()}
                  disabled={salvando}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdicionarItem}
                  disabled={salvando || !novoItem.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Status</p>
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
                        onClick={() => handleMudarStatus(key as StatusRoadmap)}
                        disabled={key === tarefa.status}
                      >
                        {val.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Prioridade */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Prioridade</p>
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
                        onClick={() => handleMudarPrioridade(key as PrioridadeRoadmap)}
                        disabled={key === tarefa.prioridade}
                      >
                        {val.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Excluir */}
              <div className="pt-2 border-t">
                <ConfirmacaoExclusao
                  titulo="Excluir tarefa"
                  descricao="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
                  onConfirmar={handleExcluir}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
