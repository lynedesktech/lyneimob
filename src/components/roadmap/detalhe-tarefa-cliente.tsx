"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Trash2, Plus, CheckCircle2, Circle, FileText, ListChecks,
  Pencil, History, CalendarDays, User, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { STATUS_ROADMAP, PRIORIDADE_ROADMAP } from "@/types/roadmap"
import type { TarefaRoadmap, StatusRoadmap, PrioridadeRoadmap, HistoricoTarefaRoadmap } from "@/types/roadmap"
import { atualizarTarefaRoadmap, excluirTarefaRoadmap } from "@/actions/roadmap"

// ============================================================
// Ícones por tipo de mudança no histórico
// ============================================================

const ICONE_HISTORICO: Record<string, string> = {
  status: "text-info",
  prioridade: "text-warning",
  checklist: "text-success",
  titulo: "text-foreground",
  descricao: "text-foreground",
  responsavel: "text-accent-blue",
  vencimento: "text-warning",
  criacao: "text-success",
}

// ============================================================
// Componente principal
// ============================================================

interface DetalheTarefaClienteProps {
  tarefa: TarefaRoadmap
  historicoInicial?: HistoricoTarefaRoadmap[]
  superAdmins?: { id: string; nome: string }[]
}

export function DetalheTarefaCliente({ tarefa: tarefaInicial, historicoInicial = [], superAdmins = [] }: DetalheTarefaClienteProps) {
  const router = useRouter()
  const [tarefa, setTarefa] = useState(tarefaInicial)
  const [historico, setHistorico] = useState(historicoInicial)
  const [novoItem, setNovoItem] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Estado de edição do título
  const [editandoTitulo, setEditandoTitulo] = useState(false)
  const [tituloTemp, setTituloTemp] = useState(tarefa.titulo)
  const inputTituloRef = useRef<HTMLInputElement>(null)

  // Estado de edição da descrição
  const [editandoDescricao, setEditandoDescricao] = useState(false)
  const [descricaoTemp, setDescricaoTemp] = useState(tarefa.descricao || "")

  // ============================================================
  // Handlers
  // ============================================================

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
      router.refresh()
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
      router.refresh()
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
      router.refresh()
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
      router.refresh()
    }
  }

  async function handleMudarVencimento(data: string) {
    const novaData = data || null
    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { data_vencimento: novaData })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(novaData ? "Vencimento definido." : "Vencimento removido.")
      setTarefa((prev) => ({ ...prev, data_vencimento: novaData }))
      router.refresh()
    }
  }

  async function handleMudarResponsavel(id: string | null) {
    setSalvando(true)
    const resultado = await atualizarTarefaRoadmap(tarefa.id, { responsavel_id: id })
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(id ? "Responsável definido." : "Responsável removido.")
      setTarefa((prev) => ({ ...prev, responsavel_id: id }))
      router.refresh()
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
      router.refresh()
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
      router.refresh()
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
      router.refresh()
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

  // Verificar se está atrasada
  const atrasada = tarefa.data_vencimento && tarefa.status !== "concluido" &&
    new Date(tarefa.data_vencimento + "T23:59:59") < new Date()

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
          {tarefa.data_vencimento && (
            <>
              {" · "}
              <span className={atrasada ? "text-destructive font-medium" : ""}>
                {atrasada ? "Atrasada — " : ""}Vence em{" "}
                {new Date(tarefa.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
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

          {/* Histórico */}
          {historico.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historico.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="mt-0.5">
                        <ArrowRight className={`h-4 w-4 ${ICONE_HISTORICO[item.tipo] || "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.usuario_nome} · {new Date(item.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                <Select
                  value={tarefa.status}
                  onValueChange={(v) => handleMudarStatus(v as StatusRoadmap)}
                  disabled={salvando}
                >
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

              {/* Prioridade */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Prioridade</p>
                <Select
                  value={tarefa.prioridade}
                  onValueChange={(v) => handleMudarPrioridade(v as PrioridadeRoadmap)}
                  disabled={salvando}
                >
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

              {/* Vencimento */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Vencimento
                </p>
                <Input
                  type="date"
                  value={tarefa.data_vencimento || ""}
                  onChange={(e) => handleMudarVencimento(e.target.value)}
                  disabled={salvando}
                  className="text-sm w-full"
                />
              </div>

              {/* Responsável */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Responsável
                </p>
                <Select
                  value={tarefa.responsavel_id || "__nenhum__"}
                  onValueChange={(v) => handleMudarResponsavel(v === "__nenhum__" ? null : v)}
                  disabled={salvando}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Não definido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__nenhum__">Não definido</SelectItem>
                    {superAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
