"use client"

import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useConfigDistribuicao } from "@/hooks/use-config-distribuicao"

export function CargaCorretores() {
  const { corretores, config, carregando } = useConfigDistribuicao()

  if (carregando) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (corretores.length === 0) return null

  // Calcular carga máxima para proporção da barra
  const maxCarga = Math.max(...corretores.map((c) => c.negocios_abertos), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Carga por Corretor
        </CardTitle>
        <CardDescription>
          Negócios abertos atribuídos a cada membro da equipe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {corretores.map((corretor) => {
            const percentual = maxCarga > 0
              ? (corretor.negocios_abertos / maxCarga) * 100
              : 0

            return (
              <div key={corretor.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{corretor.nome}</span>
                    <Badge variant="secondary" className="text-xs">
                      {corretor.cargo}
                    </Badge>
                    {config?.modo !== "manual" && corretor.participa_distribuicao && (
                      <Badge variant="outline" className="text-xs text-primary border-primary/30">
                        Na distribuição
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {corretor.negocios_abertos} {corretor.negocios_abertos === 1 ? "negócio" : "negócios"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.max(percentual, 2)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
