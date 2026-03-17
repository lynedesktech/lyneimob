"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { GripVertical, Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { useTiposAtividade } from "@/hooks/use-tipos-atividade"
import {
  criarTipoAtividade,
  atualizarTipoAtividade,
  excluirTipoAtividade,
  reordenarTiposAtividade,
} from "@/actions/tipos-atividade"
import type { TipoAtividadeRegistro } from "@/types/database"

// Paleta de cores pré-definidas
const CORES_PREDEFINIDAS = [
  "#3b82f6", // azul
  "#8b5cf6", // roxo
  "#22c55e", // verde
  "#f59e0b", // âmbar
  "#06b6d4", // ciano
  "#f97316", // laranja
  "#ef4444", // vermelho
  "#ec4899", // rosa
  "#6b7280", // cinza
  "#84cc16", // lima
  "#a78bfa", // violeta
  "#fb923c", // laranja claro
]

// ============================================================
// Seletor de cor reutilizável
// ============================================================

function SeletorCor({ cor, onChange }: { cor: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {CORES_PREDEFINIDAS.map((c) => (
          <button
            key={c}
            type="button"
            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
              cor === c ? "border-foreground scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full border" style={{ backgroundColor: cor }} />
        <Input
          type="text"
          value={cor}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-28 font-mono text-xs"
          placeholder="#6b7280"
        />
      </div>
    </div>
  )
}

// ============================================================
// Dialog de criação
// ============================================================

function DialogCriarTipo({ onSucesso }: { onSucesso: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [cor, setCor] = useState("#3b82f6")
  const [estado, formAction, pendente] = useActionState(criarTipoAtividade, {})

  useEffect(() => {
    if (estado.erro) toast.error(estado.erro)
    if (estado.sucesso) {
      toast.success(estado.sucesso)
      setAberto(false)
      onSucesso()
    }
  }, [estado, onSucesso])

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Tipo de Atividade</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="cor" value={cor} />
          <Field>
            <FieldLabel htmlFor="nome-criar-tipo">Nome *</FieldLabel>
            <Input
              id="nome-criar-tipo"
              name="nome"
              placeholder="Ex: Assinatura de Contrato"
              autoFocus
            />
          </Field>
          <div className="space-y-1">
            <FieldLabel>Cor</FieldLabel>
            <SeletorCor cor={cor} onChange={setCor} />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
            <Button type="submit" disabled={pendente}>
              {pendente ? "Criando..." : "Criar Tipo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog de edição
// ============================================================

function DialogEditarTipo({
  tipo,
  onSucesso,
}: {
  tipo: TipoAtividadeRegistro
  onSucesso: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [cor, setCor] = useState(tipo.cor)
  const [estado, formAction, pendente] = useActionState(atualizarTipoAtividade, {})

  useEffect(() => {
    if (estado.erro) toast.error(estado.erro)
    if (estado.sucesso) {
      toast.success(estado.sucesso)
      setAberto(false)
      onSucesso()
    }
  }, [estado, onSucesso])

  useEffect(() => {
    if (aberto) setCor(tipo.cor)
  }, [aberto, tipo.cor])

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Tipo</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={tipo.id} />
          <input type="hidden" name="cor" value={cor} />
          <Field>
            <FieldLabel htmlFor={`nome-editar-tipo-${tipo.id}`}>Nome *</FieldLabel>
            <Input
              id={`nome-editar-tipo-${tipo.id}`}
              name="nome"
              defaultValue={tipo.nome}
              autoFocus
            />
          </Field>
          <div className="space-y-1">
            <FieldLabel>Cor</FieldLabel>
            <SeletorCor cor={cor} onChange={setCor} />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog de confirmação de exclusão
// ============================================================

function DialogExcluirTipo({
  tipo,
  onSucesso,
}: {
  tipo: TipoAtividadeRegistro
  onSucesso: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)

  if (tipo.sistema) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground/40"
        disabled
        title="Tipos padrão não podem ser excluídos"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    )
  }

  async function confirmarExclusao() {
    setCarregando(true)
    const resultado = await excluirTipoAtividade(tipo.id)
    setCarregando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setAberto(false)
      onSucesso()
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      } />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir tipo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que quer excluir o tipo{" "}
          <strong className="text-foreground">"{tipo.nome}"</strong>?
          Não é possível excluir se houver atividades usando este tipo.
        </p>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
          <Button
            variant="destructive"
            onClick={confirmarExclusao}
            disabled={carregando}
          >
            {carregando ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Linha de tipo
// ============================================================

function LinhaTipo({
  tipo,
  indice,
  total,
  onMoverCima,
  onMoverBaixo,
  onAtualizar,
}: {
  tipo: TipoAtividadeRegistro
  indice: number
  total: number
  onMoverCima: () => void
  onMoverBaixo: () => void
  onAtualizar: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />

      {/* Cor */}
      <div
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: tipo.cor }}
      />

      {/* Nome */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tipo.nome}</p>
        <p className="text-xs text-muted-foreground font-mono">{tipo.slug}</p>
      </div>

      {/* Badge sistema */}
      {tipo.sistema && (
        <Badge variant="outline" className="shrink-0 text-xs">
          Padrão
        </Badge>
      )}

      {/* Reordenar */}
      <div className="flex gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={indice === 0}
          onClick={onMoverCima}
          title="Mover para cima"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={indice === total - 1}
          onClick={onMoverBaixo}
          title="Mover para baixo"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <DialogEditarTipo tipo={tipo} onSucesso={onAtualizar} />
      <DialogExcluirTipo tipo={tipo} onSucesso={onAtualizar} />
    </div>
  )
}

// ============================================================
// Componente principal
// ============================================================

export function ConteudoTiposAtividadeConfig() {
  const { tipos, carregando, recarregar } = useTiposAtividade()
  const [reordenando, setReordenando] = useState(false)

  async function moverTipo(indice: number, direcao: "cima" | "baixo") {
    const novaOrdem = [...tipos]
    const novoIndice = direcao === "cima" ? indice - 1 : indice + 1

    if (novoIndice < 0 || novoIndice >= novaOrdem.length) return

    const temp = novaOrdem[novoIndice]
    novaOrdem[novoIndice] = novaOrdem[indice]
    novaOrdem[indice] = temp

    setReordenando(true)
    const resultado = await reordenarTiposAtividade(novaOrdem.map((t) => t.id))
    setReordenando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      recarregar()
    }
  }

  if (carregando) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Tipos de Atividade</CardTitle>
            <CardDescription>
              Personalize as categorias de atividades da sua equipe. Use as setas para reordenar.
            </CardDescription>
          </div>
          <DialogCriarTipo onSucesso={() => recarregar()} />
        </CardHeader>
        <CardContent>
          {tipos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum tipo cadastrado
            </p>
          ) : (
            <div className="space-y-2" aria-busy={reordenando}>
              {tipos.map((tipo, i) => (
                <LinhaTipo
                  key={tipo.id}
                  tipo={tipo}
                  indice={i}
                  total={tipos.length}
                  onMoverCima={() => moverTipo(i, "cima")}
                  onMoverBaixo={() => moverTipo(i, "baixo")}
                  onAtualizar={() => recarregar()}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-muted bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Dica:</strong> Os tipos <em>Padrão</em> são tipos do sistema e não podem ser
            excluídos, mas você pode renomeá-los e mudar a cor. Para remover um tipo personalizado,
            primeiro reclassifique todas as atividades que o usam.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
