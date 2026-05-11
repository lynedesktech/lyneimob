import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

type VarianteKpi = "primary" | "info" | "success" | "warning" | "muted"

const classesPorVariante: Record<VarianteKpi, string> = {
  primary: "bg-accent text-accent-foreground",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  muted: "bg-muted text-muted-foreground",
}

interface CardKpiProps {
  titulo: string
  valor: number
  descricao: string
  icone: LucideIcon
  href: string
  variante?: VarianteKpi
}

export function CardKpi({
  titulo,
  valor,
  descricao,
  icone: Icone,
  href,
  variante = "primary",
}: CardKpiProps) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${classesPorVariante[variante]}`}
          >
            <Icone className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{valor}</div>
          <CardDescription className="mt-0.5">{descricao}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}
