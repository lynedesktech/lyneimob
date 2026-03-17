"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { StatusBadge, configStatusCliente } from "@/components/ui/status-badge"
import { ScoreBadge } from "./score-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { labelsTipoCliente, labelsOrigem } from "@/lib/constantes"
import type { Cliente } from "@/types/database"

type ColunasVisiveis = {
  origem: boolean
  telefone: boolean
  email: boolean
  score: boolean
  cadastro: boolean
}

const colunasPadrao: ColunasVisiveis = {
  origem: true,
  telefone: true,
  email: true,
  score: true,
  cadastro: true,
}

export function TabelaClientes({ clientes, total = 0, filtros, paginacao }: { clientes: Cliente[]; total?: number; filtros?: React.ReactNode; paginacao?: React.ReactNode }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [colunas, setColunas] = useState<ColunasVisiveis>(colunasPadrao)

  const todosSelecionados =
    clientes.length > 0 && clientes.every((c) => selecionados.has(c.id))
  const algunsSelecionados =
    clientes.some((c) => selecionados.has(c.id)) && !todosSelecionados

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(clientes.map((c) => c.id)))
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
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {filtros ? (
          <div className="flex-1">{filtros}</div>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "cliente encontrado" : "clientes encontrados"}
          </p>
        )}
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
              checked={colunas.origem}
              onCheckedChange={() => toggleColuna("origem")}
            >
              Origem
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.telefone}
              onCheckedChange={() => toggleColuna("telefone")}
            >
              Telefone
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.email}
              onCheckedChange={() => toggleColuna("email")}
            >
              E-mail
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.score}
              onCheckedChange={() => toggleColuna("score")}
            >
              Score
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.cadastro}
              onCheckedChange={() => toggleColuna("cadastro")}
            >
              Cadastro
            </DropdownMenuCheckboxItem>
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
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              {colunas.origem && <TableHead>Origem</TableHead>}
              <TableHead>Status</TableHead>
              {colunas.telefone && <TableHead>Telefone</TableHead>}
              {colunas.email && <TableHead>E-mail</TableHead>}
              {colunas.score && <TableHead>Score</TableHead>}
              {colunas.cadastro && <TableHead>Cadastro</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => {
              const selecionado = selecionados.has(cliente.id)
              return (
                <TableRow
                  key={cliente.id}
                  data-state={selecionado ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => toggleSelecionado(cliente.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selecionado}
                      onCheckedChange={() => toggleSelecionado(cliente.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {cliente.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {labelsTipoCliente[cliente.tipo] ?? cliente.tipo}
                  </TableCell>
                  {colunas.origem && (
                    <TableCell className="text-muted-foreground">
                      {labelsOrigem[cliente.origem] ?? cliente.origem}
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusBadge status={cliente.status} config={configStatusCliente} />
                  </TableCell>
                  {colunas.telefone && (
                    <TableCell className="text-muted-foreground">
                      {cliente.telefone ?? "—"}
                    </TableCell>
                  )}
                  {colunas.email && (
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {cliente.email ?? "—"}
                    </TableCell>
                  )}
                  {colunas.score && (
                    <TableCell>
                      {cliente.score_lead > 0 ? (
                        <ScoreBadge score={cliente.score_lead} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  {colunas.cadastro && (
                    <TableCell className="text-muted-foreground">
                      {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          render={<Link href={`/clientes/${cliente.id}`} />}
                        >
                          Ver cliente
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          render={<Link href={`/clientes/${cliente.id}/editar`} />}
                        >
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {filtros && paginacao && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "cliente encontrado" : "clientes encontrados"}
          </p>
          {paginacao}
        </div>
      )}
    </div>
  )
}
