"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ErroDashboard({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const tentativasRef = useRef(0)
  const [mostrarUI, setMostrarUI] = useState(false)

  useEffect(() => {
    console.error(error)

    // Erros transientes de navegação: tentar recuperar automaticamente (até 2x)
    if (tentativasRef.current < 2) {
      tentativasRef.current++
      const timer = setTimeout(() => {
        reset()
      }, 300)
      return () => clearTimeout(timer)
    }

    // Após 2 tentativas, mostrar UI de erro
    setMostrarUI(true)
  }, [error, reset])

  if (!mostrarUI) return null

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="space-y-4 pt-8 pb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado. Tente novamente ou volte ao painel.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => { tentativasRef.current = 0; reset() }}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
            <Button render={<Link href="/painel" />}>
              <Home className="mr-2 h-4 w-4" />
              Painel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
