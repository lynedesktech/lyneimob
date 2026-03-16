import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface EstadoVazioProps {
  icone?: LucideIcon
  titulo: string
  descricao?: string
  acao?: ReactNode
  className?: string
}

export function EstadoVazio({ icone: Icone, titulo, descricao, acao, className }: EstadoVazioProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center ${className ?? ""}`}>
      {Icone && <Icone className="mb-4 h-12 w-12 text-muted-foreground" />}
      <h3 className="text-lg font-medium">{titulo}</h3>
      {descricao && (
        <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      )}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}
