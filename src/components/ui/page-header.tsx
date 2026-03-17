import * as React from "react"

type PageHeaderProps = {
  titulo: string
  descricao?: string
  acoes?: React.ReactNode
}

export function PageHeader({ titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {descricao && (
          <p className="text-sm text-muted-foreground">{descricao}</p>
        )}
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </div>
  )
}
