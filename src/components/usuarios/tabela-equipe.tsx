"use client"

import { useState } from "react"
import { MoreHorizontal, Columns3, ShieldCheck, Shield, User } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import type { Usuario } from "@/types/database"

const CARGOS_LABELS: Record<string, { label: string; cor: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", cor: "default" },
  gerente: { label: "Gerente", cor: "secondary" },
  corretor: { label: "Corretor", cor: "outline" },
}

type ColunasVisiveis = {
  email: boolean
  cargo: boolean
  status: boolean
}

const colunasPadrao: ColunasVisiveis = {
  email: true,
  cargo: true,
  status: true,
}

interface TabelaEquipeProps {
  usuarios: Usuario[]
  total?: number
  ehAdmin: boolean
  usuarioLogadoId: string
  filtros?: React.ReactNode
  paginacao?: React.ReactNode
  onAlterarCargo: (usuario: Usuario) => void
  onAlternarStatus: (usuario: Usuario) => void
  onRemover: (usuario: Usuario) => void
}

export function TabelaEquipe({
  usuarios,
  total = 0,
  ehAdmin,
  usuarioLogadoId,
  filtros,
  paginacao,
  onAlterarCargo,
  onAlternarStatus,
  onRemover,
}: TabelaEquipeProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [colunas, setColunas] = useState<ColunasVisiveis>(colunasPadrao)

  const todosSelecionados =
    usuarios.length > 0 && usuarios.every((u) => selecionados.has(u.id))
  const algunsSelecionados =
    usuarios.some((u) => selecionados.has(u.id)) && !todosSelecionados

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(usuarios.map((u) => u.id)))
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
            {total} {total === 1 ? "membro encontrado" : "membros encontrados"}
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
              checked={colunas.email}
              onCheckedChange={() => toggleColuna("email")}
            >
              Email
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.cargo}
              onCheckedChange={() => toggleColuna("cargo")}
            >
              Cargo
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.status}
              onCheckedChange={() => toggleColuna("status")}
            >
              Status
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
              <TableHead>Nome</TableHead>
              {colunas.email && <TableHead>Email</TableHead>}
              {colunas.cargo && <TableHead>Cargo</TableHead>}
              {colunas.status && <TableHead>Status</TableHead>}
              {ehAdmin && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => {
              const selecionado = selecionados.has(u.id)
              const ehProprioUsuario = u.id === usuarioLogadoId
              const IconeCargo = u.cargo === "admin" ? ShieldCheck : u.cargo === "gerente" ? Shield : User

              return (
                <TableRow
                  key={u.id}
                  data-state={selecionado ? "selected" : undefined}
                  className={`cursor-pointer ${!u.ativo ? "opacity-50" : ""}`}
                  onClick={() => toggleSelecionado(u.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selecionado}
                      onCheckedChange={() => toggleSelecionado(u.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconeCargo className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{u.nome}</span>
                      {ehProprioUsuario && (
                        <Badge variant="outline" className="text-xs">
                          Você
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {colunas.email && (
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  )}
                  {colunas.cargo && (
                    <TableCell>
                      <Badge variant={CARGOS_LABELS[u.cargo]?.cor ?? "outline"}>
                        {CARGOS_LABELS[u.cargo]?.label ?? u.cargo}
                      </Badge>
                    </TableCell>
                  )}
                  {colunas.status && (
                    <TableCell>
                      <Badge variant={u.ativo ? "default" : "destructive"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  )}
                  {ehAdmin && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {!ehProprioUsuario && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 w-7 p-0" })}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onAlterarCargo(u)}>
                              Alterar cargo
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onAlternarStatus(u)}>
                              {u.ativo ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => onRemover(u)}
                            >
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={ehAdmin ? 6 : 5}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtros && paginacao && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "membro encontrado" : "membros encontrados"}
          </p>
          {paginacao}
        </div>
      )}
    </div>
  )
}
