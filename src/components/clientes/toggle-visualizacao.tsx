"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"

export function ToggleVisualizacao() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modoAtual = searchParams.get("view") ?? "cards"

  const alternarModo = useCallback(
    (modo: "cards" | "lista") => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("view", modo)
      params.delete("pagina")
      router.push(`/clientes?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex items-center rounded-md border bg-background p-0.5 gap-0.5">
      <Button
        variant={modoAtual === "cards" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => alternarModo("cards")}
        title="Visualização em cards"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={modoAtual === "lista" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => alternarModo("lista")}
        title="Visualização em lista"
      >
        <List className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
