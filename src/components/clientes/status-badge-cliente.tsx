import { Badge } from "@/components/ui/badge"
import type { StatusCliente } from "@/types/database"

const configStatus: Record<
  StatusCliente,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ativo: { label: "Ativo", variant: "default" },
  negociando: { label: "Negociando", variant: "secondary" },
  fechado: { label: "Fechado", variant: "outline" },
  inativo: { label: "Inativo", variant: "destructive" },
}

export function StatusBadgeCliente({ status }: { status: StatusCliente }) {
  const config = configStatus[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
