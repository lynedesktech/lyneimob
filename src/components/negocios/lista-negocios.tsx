"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Briefcase, MoreHorizontal, Columns3 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusNegocio } from "@/lib/constantes/status-configs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FiltrosListaNegocios } from "./filtros-lista-negocios"
import { BarraAcoesMassa } from "./barra-acoes-massa"
import { useListaNegocios } from "@/hooks/use-lista-negocios"
import { formatarPreco, formatarData } from "@/lib/formatadores"
import { labelsTipoNegocio } from "@/lib/constantes/negocios"
import { ganharNegocio, perderNegocio, reabrirNegocio } from "@/actions/negocios"
import { toast } from "sonner"
import type { FiltrosLista } from "./filtros-lista-negocios"

type ColunasVisiveis = {
  etapa: boolean
  tipo: boolean
  previsao: boolean
  corretor: boolean
}

const colunasPadrao: ColunasVisiveis = {
  etapa: true,
  tipo: true,
  previsao: true,
  corretor: true,
}

// ============================================================
// Menu de ações por linha
// ============================================================

function MenuAcoes({
  negocio,
  onAcaoConcluida,
}: {
  negocio: { id: string; titulo: string; status: string; valor: number | null }
  onAcaoConcluida: () => void
}) {
  const [dialogGanhar, setDialogGanhar] = useState(false)
  const [dialogPerder, setDialogPerder] = useState(false)
  const [valor, setValor] = useState(negocio.valor?.toString() || "")
  const [motivoPerda, setMotivoPerda] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function handleGanhar() {
    setSalvando(true)
    const resultado = await ganharNegocio(negocio.id, valor ? Number(valor) : undefined)
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setDialogGanhar(false)
      onAcaoConcluida()
    }
  }

  async function handlePerder() {
    if (!motivoPerda.trim()) {
      toast.error("Informe o motivo da perda")
      return
    }
    setSalvando(true)
    const formData = new FormData()
    formData.append("id", negocio.id)
    formData.append("motivo_perda", motivoPerda)
    const resultado = await perderNegocio({}, formData)
    setSalvando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setDialogPerder(false)
      onAcaoConcluida()
    }
  }

  async function handleReabrir() {
    const resultado = await reabrirNegocio(negocio.id)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      onAcaoConcluida()
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ações</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem
            render={<Link href={`/negocios/${negocio.id}`} onClick={(e) => e.stopPropagation()} />}
          >
            Ver negócio
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {negocio.status === "aberto" && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setDialogGanhar(true)
                }}
              >
                Ganhar negócio
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setDialogPerder(true)
                }}
              >
                Marcar como perdido
              </DropdownMenuItem>
            </>
          )}
          {(negocio.status === "ganho" || negocio.status === "perdido") && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleReabrir()
              }}
            >
              Reabrir negócio
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog Ganhar */}
      <Dialog open={dialogGanhar} onOpenChange={setDialogGanhar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como ganho</DialogTitle>
            <DialogDescription>Confirme o valor final do negócio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`valor-ganhar-${negocio.id}`}>Valor Final (R$)</Label>
            <Input
              id={`valor-ganhar-${negocio.id}`}
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Valor do negócio fechado"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogGanhar(false)}>Cancelar</Button>
            <Button variant="success" onClick={handleGanhar} disabled={salvando}>
              {salvando ? "Salvando..." : "Confirmar Ganho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Perder */}
      <Dialog open={dialogPerder} onOpenChange={setDialogPerder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como perdido</DialogTitle>
            <DialogDescription>Informe o motivo da perda para análise futura.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`motivo-${negocio.id}`}>Motivo da perda *</Label>
            <Textarea
              id={`motivo-${negocio.id}`}
              value={motivoPerda}
              onChange={(e) => setMotivoPerda(e.target.value)}
              placeholder="Ex: Cliente desistiu, preço alto, escolheu concorrente..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPerder(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handlePerder} disabled={salvando}>
              {salvando ? "Salvando..." : "Confirmar Perda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================================
// Componente principal
// ============================================================

export function ListaNegocios() {
  const [filtros, setFiltros] = useState<FiltrosLista>({})
  const [pagina, setPagina] = useState(1)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [colunas, setColunas] = useState<ColunasVisiveis>(colunasPadrao)

  const { negocios, total, totalPaginas, carregando, recarregar } = useListaNegocios({
    ...filtros,
    pagina,
    por_pagina: 20,
  })

  useEffect(() => {
    setSelecionados(new Set())
  }, [filtros, pagina])

  const todosSelecionados =
    negocios.length > 0 && negocios.every((n) => selecionados.has(n.id))
  const algunsSelecionados =
    negocios.some((n) => selecionados.has(n.id)) && !todosSelecionados

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados((prev) => {
        const novo = new Set(prev)
        negocios.forEach((n) => novo.delete(n.id))
        return novo
      })
    } else {
      setSelecionados((prev) => {
        const novo = new Set(prev)
        negocios.forEach((n) => novo.add(n.id))
        return novo
      })
    }
  }

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function toggleColuna(col: keyof ColunasVisiveis) {
    setColunas((prev) => ({ ...prev, [col]: !prev[col] }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <FiltrosListaNegocios
            filtros={filtros}
            onChange={(novosFiltros) => {
              setFiltros(novosFiltros)
              setPagina(1)
            }}
          />
        </div>

        {/* Seletor de colunas */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-4 w-4" />
                Colunas
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Visibilidade</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={colunas.etapa}
              onCheckedChange={() => toggleColuna("etapa")}
            >
              Etapa
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.tipo}
              onCheckedChange={() => toggleColuna("tipo")}
            >
              Tipo
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.previsao}
              onCheckedChange={() => toggleColuna("previsao")}
            >
              Previsão
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.corretor}
              onCheckedChange={() => toggleColuna("corretor")}
            >
              Corretor
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {carregando ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : negocios.length === 0 ? (
        <EstadoVazio
          icone={Briefcase}
          titulo="Nenhum negócio encontrado"
          descricao="Tente ajustar os filtros ou crie um novo negócio."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    checked={todosSelecionados}
                    indeterminate={!todosSelecionados && algunsSelecionados}
                    onCheckedChange={toggleTodos}
                  />
                </TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                {colunas.etapa && <TableHead>Etapa</TableHead>}
                <TableHead>Valor</TableHead>
                {colunas.tipo && <TableHead>Tipo</TableHead>}
                <TableHead>Status</TableHead>
                {colunas.previsao && <TableHead>Previsão</TableHead>}
                {colunas.corretor && <TableHead>Corretor</TableHead>}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {negocios.map((negocio) => {
                const selecionado = selecionados.has(negocio.id)
                return (
                  <TableRow
                    key={negocio.id}
                    data-state={selecionado ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => toggleSelecionado(negocio.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selecionado}
                        onCheckedChange={() => toggleSelecionado(negocio.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/negocios/${negocio.id}`}
                        className="font-medium text-foreground hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {negocio.titulo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {negocio.clientes?.nome ?? "—"}
                    </TableCell>
                    {colunas.etapa && (
                      <TableCell>
                        {negocio.pipeline_etapas ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: negocio.pipeline_etapas.cor }}
                            />
                            <span className="text-muted-foreground">
                              {negocio.pipeline_etapas.nome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {formatarPreco(negocio.valor)}
                    </TableCell>
                    {colunas.tipo && (
                      <TableCell className="text-muted-foreground">
                        {labelsTipoNegocio[negocio.tipo] ?? negocio.tipo}
                      </TableCell>
                    )}
                    <TableCell>
                      <StatusBadge status={negocio.status} config={configStatusNegocio} />
                    </TableCell>
                    {colunas.previsao && (
                      <TableCell className="text-muted-foreground">
                        {formatarData(negocio.previsao_fechamento)}
                      </TableCell>
                    )}
                    {colunas.corretor && (
                      <TableCell className="text-muted-foreground">
                        {negocio.usuarios?.nome ?? "—"}
                      </TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <MenuAcoes
                        negocio={negocio}
                        onAcaoConcluida={recarregar}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!carregando && negocios.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} negócio{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>
          <PaginacaoListagem
            pagina={pagina}
            totalPaginas={totalPaginas}
            onMudarPagina={setPagina}
          />
        </div>
      )}

      <BarraAcoesMassa
        selecionados={Array.from(selecionados)}
        onLimpar={() => setSelecionados(new Set())}
        onAcaoConcluida={() => {
          setSelecionados(new Set())
          recarregar()
        }}
      />
    </div>
  )
}
