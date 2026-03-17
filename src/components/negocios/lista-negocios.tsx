"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Briefcase } from "lucide-react"
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
import { FiltrosListaNegocios } from "./filtros-lista-negocios"
import { BarraAcoesMassa } from "./barra-acoes-massa"
import { useListaNegocios } from "@/hooks/use-lista-negocios"
import { formatarPreco, formatarData } from "@/lib/formatadores"
import { labelsTipoNegocio, labelsStatusNegocio } from "@/lib/constantes/negocios"
import { cn } from "@/lib/utils"
import type { FiltrosLista } from "./filtros-lista-negocios"

const coresStatus: Record<string, string> = {
  aberto: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  ganho: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  perdido: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
}

export function ListaNegocios() {
  const [filtros, setFiltros] = useState<FiltrosLista>({})
  const [pagina, setPagina] = useState(1)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  const { negocios, total, totalPaginas, carregando, recarregar } = useListaNegocios({
    ...filtros,
    pagina,
    por_pagina: 20,
  })

  // Limpar seleção ao mudar filtros ou página
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

  return (
    <div className="space-y-4">
      <FiltrosListaNegocios
        filtros={filtros}
        onChange={(novosFiltros) => {
          setFiltros(novosFiltros)
          setPagina(1)
        }}
      />

      {/* Contador */}
      {!carregando && total > 0 && (
        <p className="text-sm text-muted-foreground">
          {total} negócio{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
        </p>
      )}

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
                <TableHead>Etapa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Previsão</TableHead>
                <TableHead>Corretor</TableHead>
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
                    <TableCell className="font-medium">
                      {formatarPreco(negocio.valor)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {labelsTipoNegocio[negocio.tipo] ?? negocio.tipo}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          coresStatus[negocio.status]
                        )}
                      >
                        {labelsStatusNegocio[negocio.status] ?? negocio.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatarData(negocio.previsao_fechamento)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {negocio.usuarios?.nome ?? "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PaginacaoListagem
        pagina={pagina}
        totalPaginas={totalPaginas}
        onMudarPagina={setPagina}
      />

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
