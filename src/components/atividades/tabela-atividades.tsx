"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal, Columns3 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusAtividade, configPrioridade } from "@/lib/constantes/status-configs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { useTiposAtividade } from "@/hooks/use-tipos-atividade"
import { formatarDataHoraCurta } from "@/lib/formatadores"
import type { AtividadeComRelacoes } from "@/types/database"

type ColunasVisiveis = {
  tipo: boolean
  prioridade: boolean
  data: boolean
  status: boolean
  cliente: boolean
  responsavel: boolean
}

const colunasPadrao: ColunasVisiveis = {
  tipo: true,
  prioridade: true,
  data: true,
  status: true,
  cliente: true,
  responsavel: false,
}

export function TabelaAtividades({
  atividades,
  total = 0,
  carregando = false,
  filtros,
  paginacao,
}: {
  atividades: AtividadeComRelacoes[]
  total?: number
  carregando?: boolean
  filtros?: React.ReactNode
  paginacao?: React.ReactNode
}) {
  const router = useRouter()
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [colunas, setColunas] = useState<ColunasVisiveis>(colunasPadrao)
  const { labelDoTipo } = useTiposAtividade()

  const todosSelecionados =
    atividades.length > 0 && atividades.every((a) => selecionados.has(a.id))
  const algunsSelecionados =
    atividades.some((a) => selecionados.has(a.id)) && !todosSelecionados

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(atividades.map((a) => a.id)))
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

  if (carregando) {
    return (
      <div className="space-y-2">
        {filtros && <div className="flex items-center gap-3"><div className="flex-1">{filtros}</div></div>}
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {filtros ? (
          <div className="flex-1">{filtros}</div>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "atividade encontrada" : "atividades encontradas"}
          </p>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2" })}>
            <Columns3 className="h-4 w-4" />
            Colunas
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Visibilidade</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={colunas.tipo}
                onCheckedChange={() => toggleColuna("tipo")}
              >
                Tipo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.prioridade}
                onCheckedChange={() => toggleColuna("prioridade")}
              >
                Prioridade
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.data}
                onCheckedChange={() => toggleColuna("data")}
              >
                Data
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.status}
                onCheckedChange={() => toggleColuna("status")}
              >
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.cliente}
                onCheckedChange={() => toggleColuna("cliente")}
              >
                Cliente
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.responsavel}
                onCheckedChange={() => toggleColuna("responsavel")}
              >
                Responsável
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
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
              {colunas.tipo && <TableHead>Tipo</TableHead>}
              {colunas.prioridade && <TableHead>Prioridade</TableHead>}
              {colunas.data && <TableHead>Data</TableHead>}
              {colunas.status && <TableHead>Status</TableHead>}
              {colunas.cliente && <TableHead>Cliente</TableHead>}
              {colunas.responsavel && <TableHead>Responsável</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {atividades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Nenhuma atividade encontrada
                </TableCell>
              </TableRow>
            ) : (
              atividades.map((atividade) => {
                const selecionado = selecionados.has(atividade.id)
                const estaAtrasada =
                  atividade.status === "pendente" &&
                  new Date(atividade.data_vencimento) < new Date()

                return (
                  <TableRow
                    key={atividade.id}
                    data-state={selecionado ? "selected" : undefined}
                    className={`cursor-pointer ${estaAtrasada ? "border-l-2 border-l-destructive" : ""}`}
                    onClick={() => toggleSelecionado(atividade.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selecionado}
                        onCheckedChange={() => toggleSelecionado(atividade.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/atividades/${atividade.id}`}
                          className={`font-medium hover:underline ${
                            atividade.status === "cancelada" ? "line-through text-muted-foreground" : ""
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {atividade.titulo}
                        </Link>
                        {estaAtrasada && (
                          <Badge variant="destructive" className="text-xs">Atrasada</Badge>
                        )}
                      </div>
                    </TableCell>
                    {colunas.tipo && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {labelDoTipo(atividade.tipo)}
                        </Badge>
                      </TableCell>
                    )}
                    {colunas.prioridade && (
                      <TableCell>
                        <StatusBadge status={atividade.prioridade} config={configPrioridade} className="text-xs" />
                      </TableCell>
                    )}
                    {colunas.data && (
                      <TableCell className="text-muted-foreground">
                        {formatarDataHoraCurta(atividade.data_vencimento)}
                      </TableCell>
                    )}
                    {colunas.status && (
                      <TableCell>
                        <StatusBadge status={atividade.status} config={configStatusAtividade} className="text-xs" />
                      </TableCell>
                    )}
                    {colunas.cliente && (
                      <TableCell className="text-muted-foreground">
                        {atividade.clientes?.nome ?? "—"}
                      </TableCell>
                    )}
                    {colunas.responsavel && (
                      <TableCell className="text-muted-foreground">
                        {atividade.usuarios?.nome ?? "—"}
                      </TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 w-7 p-0" })}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => router.push(`/atividades/${atividade.id}`)}>
                            Ver atividade
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => router.push(`/atividades/${atividade.id}/editar`)}>
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {paginacao && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "atividade encontrada" : "atividades encontradas"}
          </p>
          {paginacao}
        </div>
      )}
    </div>
  )
}
