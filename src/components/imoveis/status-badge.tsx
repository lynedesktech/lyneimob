import { Badge } from "@/components/ui/badge"
import type { StatusImovel } from "@/types/database"

const configStatus: Record<
  StatusImovel,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  disponivel: { label: "Disponível", variant: "default" },
  reservado: { label: "Reservado", variant: "secondary" },
  vendido: { label: "Vendido", variant: "outline" },
  alugado: { label: "Alugado", variant: "outline" },
  inativo: { label: "Inativo", variant: "destructive" },
}

export function StatusBadge({ status }: { status: StatusImovel }) {
  const config = configStatus[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
