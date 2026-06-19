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
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { usePipelineConfig } from "@/hooks/use-pipeline-config"
import {
  criarEtapaPipeline,
  atualizarEtapaPipeline,
  excluirEtapaPipeline,
  reordenarEtapasPipeline,
} from "@/actions/pipeline"
import type { PipelineEtapa } from "@/types/database"

// Paleta de cores pré-definidas para as etapas
const CORES_PREDEFINIDAS = [
  "#3b82f6", // azul
  "#8b5cf6", // roxo
  "#f59e0b", // âmbar
  "#f97316", // laranja
  "#ef4444", // vermelho
  "#22c55e", // verde
  "#06b6d4", // ciano
  "#ec4899", // rosa
  "#6b7280", // cinza
  "#84cc16", // lima
  "#a78bfa", // violeta
  "#fb923c", // laranja claro
]

// ============================================================
// Dialog de criação
// ============================================================

function DialogCriarEtapa({ onSucesso }: { onSucesso: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [cor, setCor] = useState("#3b82f6")
  const [estado, formAction, pendente] = useActionState(criarEtapaPipeline, {})

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
          Nova Etapa
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Etapa do Funil</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="cor" value={cor} />
          <Field>
            <FieldLabel htmlFor="nome-criar">Nome *</FieldLabel>
            <Input
              id="nome-criar"
              name="nome"
              placeholder="Ex: Em análise jurídica"
              autoFocus
            />
          </Field>

          <div className="space-y-2">
            <FieldLabel>Cor</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CORES_PREDEFINIDAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    cor === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCor(c)}
                  title={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-full border"
                style={{ backgroundColor: cor }}
              />
              <Input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-8 w-28 font-mono text-xs"
                placeholder="#6b7280"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
            <Button type="submit" disabled={pendente}>
              {pendente ? "Criando..." : "Criar Etapa"}
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

function DialogEditarEtapa({
  etapa,
  onSucesso,
}: {
  etapa: PipelineEtapa
  onSucesso: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [cor, setCor] = useState(etapa.cor)
  const [estado, formAction, pendente] = useActionState(atualizarEtapaPipeline, {})

  useEffect(() => {
    if (estado.erro) toast.error(estado.erro)
    if (estado.sucesso) {
      toast.success(estado.sucesso)
      setAberto(false)
      onSucesso()
    }
  }, [estado, onSucesso])

  // Sincronizar cor ao abrir
  useEffect(() => {
    if (aberto) setCor(etapa.cor)
  }, [aberto, etapa.cor])

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Etapa</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={etapa.id} />
          <input type="hidden" name="cor" value={cor} />
          <Field>
            <FieldLabel htmlFor={`nome-editar-${etapa.id}`}>Nome *</FieldLabel>
            <Input
              id={`nome-editar-${etapa.id}`}
              name="nome"
              defaultValue={etapa.nome}
              autoFocus
            />
          </Field>

          <div className="space-y-2">
            <FieldLabel>Cor</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CORES_PREDEFINIDAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    cor === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCor(c)}
                  title={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-full border"
                style={{ backgroundColor: cor }}
              />
              <Input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-8 w-28 font-mono text-xs"
                placeholder="#6b7280"
              />
            </div>
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

function DialogExcluirEtapa({
  etapa,
  onSucesso,
  protegida: protegidaExterna,
}: {
  etapa: PipelineEtapa
  onSucesso: () => void
  protegida?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const protegida = etapa.tipo === "ganho" || etapa.tipo === "perdido" || !!protegidaExterna

  async function confirmarExclusao() {
    setCarregando(true)
    const resultado = await excluirEtapaPipeline(etapa.id)
    setCarregando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setAberto(false)
      onSucesso()
    }
  }

  if (protegida) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground/40"
        disabled
        title="Esta etapa não pode ser excluída"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    )
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
          <DialogTitle>Excluir etapa</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que quer excluir a etapa{" "}
          <strong className="text-foreground">&quot;{etapa.nome}&quot;</strong>?
          Negócios em aberto nessa etapa impedem a exclusão.
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
// Linha de etapa
// ============================================================

function LinhaEtapa({
  etapa,
  indice,
  total,
  ehPrimeiraEtapaNormal,
  onMoverCima,
  onMoverBaixo,
  onAtualizar,
}: {
  etapa: PipelineEtapa
  indice: number
  total: number
  ehPrimeiraEtapaNormal: boolean
  onMoverCima: () => void
  onMoverBaixo: () => void
  onAtualizar: () => void
}) {
  const ehEspecial = etapa.tipo === "ganho" || etapa.tipo === "perdido"
  const ehPreAtendimento = etapa.tipo === "pre_atendimento_ia"
  const ehBloqueada = ehEspecial || ehPreAtendimento

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      {/* Drag handle visual (sem drag-and-drop) */}
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />

      {/* Cor */}
      <div
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: etapa.cor }}
      />

      {/* Nome */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{etapa.nome}</p>
      </div>

      {/* Badge de tipo especial */}
      {ehPrimeiraEtapaNormal && (
        <Badge variant="outline" className="shrink-0 text-xs">
          Destino IA
        </Badge>
      )}
      {ehPreAtendimento && (
        <Badge variant="outline" className="shrink-0 text-xs">
          IA
        </Badge>
      )}
      {ehEspecial && (
        <Badge variant="outline" className="shrink-0 text-xs">
          {etapa.tipo === "ganho" ? "Ganho" : "Perdido"}
        </Badge>
      )}

      {/* Ações de reordenar */}
      <div className="flex gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={indice === 0 || ehBloqueada}
          onClick={onMoverCima}
          title="Mover para cima"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={indice === total - 1 || ehBloqueada}
          onClick={onMoverBaixo}
          title="Mover para baixo"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editar */}
      <DialogEditarEtapa etapa={etapa} onSucesso={onAtualizar} />

      {/* Excluir */}
      <DialogExcluirEtapa etapa={etapa} onSucesso={onAtualizar} protegida={ehPrimeiraEtapaNormal} />
    </div>
  )
}

// ============================================================
// Componente principal
// ============================================================

export function ConteudoPipelineConfig() {
  const { etapas, carregando, recarregar } = usePipelineConfig()
  const [reordenando, setReordenando] = useState(false)

  async function moverEtapa(indice: number, direcao: "cima" | "baixo") {
    const novaOrdem = [...etapas]
    const novoIndice = direcao === "cima" ? indice - 1 : indice + 1

    if (novoIndice < 0 || novoIndice >= novaOrdem.length) return

    // Trocar posições
    const temp = novaOrdem[novoIndice]
    novaOrdem[novoIndice] = novaOrdem[indice]
    novaOrdem[indice] = temp

    setReordenando(true)
    const resultado = await reordenarEtapasPipeline(novaOrdem.map((e) => e.id))
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
            <CardTitle>Etapas do Funil</CardTitle>
            <CardDescription>
              Personalize as etapas do seu pipeline de vendas. Use as setas para reordenar.
            </CardDescription>
          </div>
          <DialogCriarEtapa onSucesso={() => recarregar()} />
        </CardHeader>
        <CardContent>
          {etapas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma etapa cadastrada
            </p>
          ) : (
            <div className="space-y-2" aria-busy={reordenando}>
              {etapas.map((etapa, i) => {
                const idPrimeiraEtapaNormal = etapas.find((e) => e.tipo === "normal")?.id
                return (
                  <LinhaEtapa
                    key={etapa.id}
                    etapa={etapa}
                    indice={i}
                    total={etapas.length}
                    ehPrimeiraEtapaNormal={etapa.id === idPrimeiraEtapaNormal}
                    onMoverCima={() => moverEtapa(i, "cima")}
                    onMoverBaixo={() => moverEtapa(i, "baixo")}
                    onAtualizar={() => recarregar()}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-muted bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Dica:</strong> As etapas <em>Pré-atendimento IA</em>, <em>Ganho</em>, <em>Perdido</em> e a
            primeira etapa do funil (destino dos leads atendidos pela IA) são obrigatórias e não podem ser excluídas.
            Você pode renomeá-las e mudar a cor, mas não removê-las.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
