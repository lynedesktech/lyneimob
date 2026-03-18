"use client"

import { useState, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { formatarPreco } from "@/lib/site/buscar-dados-site"
import type { Lote } from "@/types/database"

type Props = {
  lotes: Lote[]
}

const configBadge: Record<
  string,
  { label: string; variant: "success" | "warning" | "secondary" }
> = {
  disponivel: { label: "Disponível", variant: "success" },
  reservado: { label: "Reservado", variant: "warning" },
  vendido: { label: "Vendido", variant: "secondary" },
}

export function TabelaLotesPublico({ lotes }: Props) {
  const [quadraFiltro, setQuadraFiltro] = useState("todas")

  // Quadras únicas para o filtro
  const quadras = useMemo(() => {
    const unicas = [...new Set(lotes.map((l) => l.quadra))].sort()
    return unicas
  }, [lotes])

  // Filtrar por quadra
  const lotesFiltrados = useMemo(() => {
    const filtrados =
      quadraFiltro === "todas"
        ? lotes
        : lotes.filter((l) => l.quadra === quadraFiltro)

    // Ordenar: disponíveis primeiro, depois reservados, depois vendidos
    const ordem = { disponivel: 0, reservado: 1, vendido: 2 }
    return filtrados.sort(
      (a, b) =>
        (ordem[a.status] ?? 3) - (ordem[b.status] ?? 3) ||
        a.quadra.localeCompare(b.quadra) ||
        a.numero_lote.localeCompare(b.numero_lote)
    )
  }, [lotes, quadraFiltro])

  if (lotes.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lotes</h2>
        {quadras.length > 1 && (
          <Select value={quadraFiltro} onValueChange={(v) => setQuadraFiltro(v ?? "todas")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Quadra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as quadras</SelectItem>
              {quadras.map((q) => (
                <SelectItem key={q} value={q}>
                  Quadra {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quadra</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotesFiltrados.map((lote) => {
              const badge = configBadge[lote.status]
              return (
                <TableRow key={lote.id}>
                  <TableCell className="font-medium">{lote.quadra}</TableCell>
                  <TableCell>{lote.numero_lote}</TableCell>
                  <TableCell>
                    {lote.area ? `${lote.area}m²` : "—"}
                  </TableCell>
                  <TableCell>
                    {lote.status === "vendido"
                      ? "—"
                      : formatarPreco(lote.valor)}
                  </TableCell>
                  <TableCell>
                    {badge && (
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {lotesFiltrados.length} de {lotes.length}{" "}
        {lotes.length === 1 ? "lote" : "lotes"}
      </p>
    </div>
  )
}
