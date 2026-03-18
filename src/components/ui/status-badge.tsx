import { Badge } from "@/components/ui/badge"

export type VarianteBadge = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"

export type ConfigStatusBadge<T extends string = string> = Record<
  T,
  { label: string; variant: VarianteBadge }
>

interface StatusBadgeProps<T extends string = string> {
  status: T
  config: ConfigStatusBadge<T>
  className?: string
}

export function StatusBadge<T extends string>({ status, config, className }: StatusBadgeProps<T>) {
  const item = config[status]
  if (!item) return null
  return (
    <Badge variant={item.variant} className={className}>
      {item.label}
    </Badge>
  )
}
