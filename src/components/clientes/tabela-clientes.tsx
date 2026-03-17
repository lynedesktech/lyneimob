import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge, configStatusCliente } from "@/components/ui/status-badge"
import { ScoreBadge } from "./score-badge"
import { labelsTipoCliente, labelsOrigem } from "@/lib/constantes"
import type { Cliente } from "@/types/database"

export function TabelaClientes({ clientes }: { clientes: Cliente[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Cadastro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id} className="cursor-pointer">
              <TableCell>
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="font-medium hover:underline"
                >
                  {cliente.nome}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {labelsTipoCliente[cliente.tipo] ?? cliente.tipo}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {labelsOrigem[cliente.origem] ?? cliente.origem}
              </TableCell>
              <TableCell>
                <StatusBadge status={cliente.status} config={configStatusCliente} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cliente.telefone ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate">
                {cliente.email ?? "—"}
              </TableCell>
              <TableCell>
                {cliente.score_lead > 0 ? (
                  <ScoreBadge score={cliente.score_lead} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
