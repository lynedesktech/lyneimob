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
import { configStatusImovel } from "@/lib/constantes/status-configs"
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
import { labelsTipoImovel } from "@/lib/constantes"
import { formatarPreco } from "@/lib/formatadores"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImovelRow = Record<string, any>

type ColunasVisiveis = {
  finalidade: boolean
  cidade: boolean
  area: boolean
  quartos: boolean
}

const colunasPadrao: ColunasVisiveis = {
  finalidade: true,
  cidade: true,
  area: true,
  quartos: true,
}

const labelsFinalidade: Record<string, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
  venda_aluguel: "Venda e Aluguel",
}

export function TabelaImoveis({ imoveis, total = 0 }: { imoveis: ImovelRow[]; total?: number }) {
  const router = useRouter()
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [colunas, setColunas] = useState<ColunasVisiveis>(colunasPadrao)

  const todosSelecionados =
    imoveis.length > 0 && imoveis.every((i) => selecionados.has(i.id))
  const algunsSelecionados =
    imoveis.some((i) => selecionados.has(i.id)) && !todosSelecionados

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(imoveis.map((i) => i.id)))
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
        </p>
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
                checked={colunas.finalidade}
                onCheckedChange={() => toggleColuna("finalidade")}
              >
                Finalidade
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.cidade}
                onCheckedChange={() => toggleColuna("cidade")}
              >
                Cidade
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.area}
                onCheckedChange={() => toggleColuna("area")}
              >
                Área
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={colunas.quartos}
                onCheckedChange={() => toggleColuna("quartos")}
              >
                Quartos
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
              <TableHead>Código</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              {colunas.finalidade && <TableHead>Finalidade</TableHead>}
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              {colunas.cidade && <TableHead>Cidade</TableHead>}
              {colunas.area && <TableHead>Área</TableHead>}
              {colunas.quartos && <TableHead>Quartos</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {imoveis.map((imovel) => {
              const selecionado = selecionados.has(imovel.id)
              const preco = imovel.valor as number | null

              return (
                <TableRow
                  key={imovel.id}
                  data-state={selecionado ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => toggleSelecionado(imovel.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selecionado}
                      onCheckedChange={() => toggleSelecionado(imovel.id)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {imovel.codigo_interno}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/imoveis/${imovel.id}`}
                      className="font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {imovel.titulo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {labelsTipoImovel[imovel.tipo] ?? imovel.tipo}
                  </TableCell>
                  {colunas.finalidade && (
                    <TableCell className="text-muted-foreground">
                      {labelsFinalidade[imovel.finalidade] ?? imovel.finalidade}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {formatarPreco(preco)}
                    {imovel.finalidade !== "venda" && preco ? (
                      <span className="text-xs font-normal text-muted-foreground">/mês</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={imovel.status} config={configStatusImovel} />
                  </TableCell>
                  {colunas.cidade && (
                    <TableCell className="text-muted-foreground">
                      {imovel.bairro ? `${imovel.bairro}, ` : ""}
                      {imovel.cidade}
                    </TableCell>
                  )}
                  {colunas.area && (
                    <TableCell className="text-muted-foreground">
                      {imovel.area_total ? `${imovel.area_total}m²` : "—"}
                    </TableCell>
                  )}
                  {colunas.quartos && (
                    <TableCell className="text-muted-foreground">
                      {imovel.quartos > 0 ? imovel.quartos : "—"}
                    </TableCell>
                  )}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 w-7 p-0" })}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => router.push(`/imoveis/${imovel.id}`)}>
                          Ver imóvel
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push(`/imoveis/${imovel.id}/editar`)}>
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
    </div>
  )
}
