"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge, configStatusLote } from "@/components/ui/status-badge"
import { ConfirmacaoExclusao } from "@/components/ui/confirmacao-exclusao"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { alterarStatusLote, excluirLote } from "@/actions/loteamentos"
import { formatarPreco, formatarData } from "@/lib/formatadores"
import { labelsStatusLote } from "@/lib/constantes"
import Link from "next/link"
import { Search, MoreHorizontal, Layers, X, FileSpreadsheet } from "lucide-react"
import type { Lote } from "@/types/database"

type TabelaLotesProps = {
  lotes: Lote[]
  loteamentoId: string
}

export function TabelaLotes({ lotes, loteamentoId }: TabelaLotesProps) {
  const [busca, setBusca] = useState("")
  const [filtroQuadra, setFiltroQuadra] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null)

  // Quadras únicas para o filtro
  const quadras = useMemo(() => {
    const set = new Set(lotes.map((l) => l.quadra))
    return Array.from(set).sort()
  }, [lotes])

  // Lotes filtrados
  const lotesFiltrados = useMemo(() => {
    return lotes.filter((lote) => {
      if (filtroQuadra && lote.quadra !== filtroQuadra) return false
      if (filtroStatus && lote.status !== filtroStatus) return false
      if (busca) {
        const termo = busca.toLowerCase()
        return (
          lote.quadra.toLowerCase().includes(termo) ||
          lote.numero_lote.toLowerCase().includes(termo) ||
          lote.unidade.toLowerCase().includes(termo) ||
          (lote.comprador && lote.comprador.toLowerCase().includes(termo))
        )
      }
      return true
    })
  }, [lotes, busca, filtroQuadra, filtroStatus])

  const temFiltros = busca || filtroQuadra || filtroStatus

  async function handleAlterarStatus(id: string, status: string) {
    const resultado = await alterarStatusLote(id, status)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
  }

  if (lotes.length === 0) {
    return (
      <EstadoVazio
        icone={Layers}
        titulo="Nenhum lote cadastrado"
        descricao="Importe lotes via CSV ou cadastre manualmente"
        acao={
          <Button render={<Link href={`/loteamentos/${loteamentoId}/importar`} />}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar lotes
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros inline */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar lote..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {quadras.length > 1 && (
          <Select
            value={filtroQuadra ?? undefined}
            onValueChange={(v) => setFiltroQuadra(v || null)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Quadra" />
            </SelectTrigger>
            <SelectContent>
              {quadras.map((q) => (
                <SelectItem key={q} value={q}>
                  Quadra {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filtroStatus ?? undefined}
          onValueChange={(v) => setFiltroStatus(v || null)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(labelsStatusLote).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {temFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusca("")
              setFiltroQuadra(null)
              setFiltroStatus(null)
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {lotesFiltrados.length} de {lotes.length} lotes
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quadra</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Área</TableHead>
              <TableHead>Data Venda</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Nenhum lote encontrado com os filtros selecionados
                </TableCell>
              </TableRow>
            ) : (
              lotesFiltrados.map((lote) => (
                <TableRow key={lote.id}>
                  <TableCell className="font-medium">{lote.quadra}</TableCell>
                  <TableCell>{lote.numero_lote}</TableCell>
                  <TableCell>{lote.unidade}</TableCell>
                  <TableCell>
                    <StatusBadge status={lote.status} config={configStatusLote} />
                  </TableCell>
                  <TableCell>{lote.comprador ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatarPreco(lote.valor)}</TableCell>
                  <TableCell className="text-right">
                    {lote.area ? `${lote.area} m²` : "—"}
                  </TableCell>
                  <TableCell>
                    {lote.data_venda ? formatarData(lote.data_venda) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        {lote.status !== "disponivel" && (
                          <DropdownMenuItem onClick={() => handleAlterarStatus(lote.id, "disponivel")}>
                            Marcar como Disponível
                          </DropdownMenuItem>
                        )}
                        {lote.status !== "reservado" && (
                          <DropdownMenuItem onClick={() => handleAlterarStatus(lote.id, "reservado")}>
                            Marcar como Reservado
                          </DropdownMenuItem>
                        )}
                        {lote.status !== "vendido" && (
                          <DropdownMenuItem onClick={() => handleAlterarStatus(lote.id, "vendido")}>
                            Marcar como Vendido
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <ConfirmacaoExclusao
                          titulo="Excluir lote"
                          descricao={`Tem certeza que deseja excluir o lote ${lote.quadra}-${lote.numero_lote}? Esta ação não pode ser desfeita.`}
                          onConfirmar={excluirLote.bind(null, lote.id)}
                          tamanho="sm"
                          trigger={
                            <button className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-accent">
                              Excluir lote
                            </button>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
