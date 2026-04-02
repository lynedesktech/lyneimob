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
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusLoteamento } from "@/lib/constantes/status-configs"
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
import { formatarPreco } from "@/lib/formatadores"
import type { Loteamento, LoteamentoFoto } from "@/types/database"

type LoteamentoComCapa = Loteamento & {
  loteamento_fotos: Pick<LoteamentoFoto, "url" | "eh_capa">[]
}

type ColunasVisiveis = {
  cidade: boolean
  totalLotes: boolean
  disponiveis: boolean
  valorTotal: boolean
  cadastro: boolean
}

const colunasPadrao: ColunasVisiveis = {
  cidade: true,
  totalLotes: true,
  disponiveis: true,
  valorTotal: true,
  cadastro: false,
}

export function TabelaLoteamentos({
  loteamentos,
  total = 0,
  filtros,
  paginacao,
}: {
  loteamentos: LoteamentoComCapa[]
  total?: number
  filtros?: React.ReactNode
  paginacao?: React.ReactNode
}) {
  const router = useRouter()
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [colunas, setColunas] = useState<ColunasVisiveis>(colunasPadrao)

  const todosSelecionados =
    loteamentos.length > 0 && loteamentos.every((l) => selecionados.has(l.id))
  const algunsSelecionados =
    loteamentos.some((l) => selecionados.has(l.id)) && !todosSelecionados

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(loteamentos.map((l) => l.id)))
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
            {total} {total === 1 ? "loteamento encontrado" : "loteamentos encontrados"}
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
                checked={colunas.cidade}
                onCheckedChange={() => toggleColuna("cidade")}
              >
                Cidade/Estado
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.totalLotes}
                onCheckedChange={() => toggleColuna("totalLotes")}
              >
                Total de Lotes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.disponiveis}
                onCheckedChange={() => toggleColuna("disponiveis")}
              >
                Disponíveis
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.valorTotal}
                onCheckedChange={() => toggleColuna("valorTotal")}
              >
                Valor Total
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.cadastro}
                onCheckedChange={() => toggleColuna("cadastro")}
              >
                Cadastro
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
              {colunas.cidade && <TableHead>Cidade/Estado</TableHead>}
              <TableHead>Status</TableHead>
              {colunas.totalLotes && <TableHead>Total Lotes</TableHead>}
              {colunas.disponiveis && <TableHead>Disponíveis</TableHead>}
              {colunas.valorTotal && <TableHead>Valor Total</TableHead>}
              {colunas.cadastro && <TableHead>Cadastro</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loteamentos.map((loteamento) => {
              const selecionado = selecionados.has(loteamento.id)
              return (
                <TableRow
                  key={loteamento.id}
                  data-state={selecionado ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => toggleSelecionado(loteamento.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selecionado}
                      onCheckedChange={() => toggleSelecionado(loteamento.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/loteamentos/${loteamento.id}`}
                      className="font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {loteamento.nome}
                    </Link>
                  </TableCell>
                  {colunas.cidade && (
                    <TableCell className="text-muted-foreground">
                      {loteamento.cidade} - {loteamento.estado}
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusBadge status={loteamento.status} config={configStatusLoteamento} />
                  </TableCell>
                  {colunas.totalLotes && (
                    <TableCell className="text-muted-foreground">
                      {loteamento.total_lotes}
                    </TableCell>
                  )}
                  {colunas.disponiveis && (
                    <TableCell className="text-muted-foreground">
                      {loteamento.lotes_disponiveis}
                    </TableCell>
                  )}
                  {colunas.valorTotal && (
                    <TableCell className="font-medium">
                      {loteamento.valor_total > 0 ? formatarPreco(loteamento.valor_total) : "—"}
                    </TableCell>
                  )}
                  {colunas.cadastro && (
                    <TableCell className="text-muted-foreground">
                      {new Date(loteamento.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 w-7 p-0" })}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/loteamentos/${loteamento.id}`)}>
                          Ver loteamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/loteamentos/${loteamento.id}/editar`)}>
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
            {total} {total === 1 ? "loteamento encontrado" : "loteamentos encontrados"}
          </p>
          {paginacao}
        </div>
      )}
    </div>
  )
}
