"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { labelsStatusLoteamento } from "@/lib/constantes"

const opcoesStatus = Object.entries(labelsStatusLoteamento).map(([value, label]) => ({ value, label }))

export function FiltrosLoteamentos() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const atualizarFiltro = useCallback(
    (chave: string, valor: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (valor) {
        params.set(chave, valor)
      } else {
        params.delete(chave)
      }
      params.delete("pagina")
      router.push(`/loteamentos?${params.toString()}`)
    },
    [router, searchParams]
  )

  const limparFiltros = useCallback(() => {
    router.push("/loteamentos")
  }, [router])

  const temFiltros =
    searchParams.has("busca") ||
    searchParams.has("status")

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-[280px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, bairro ou cidade..."
          className="pl-8"
          defaultValue={searchParams.get("busca") ?? ""}
          onChange={(e) => {
            const valor = e.target.value
            const timeout = setTimeout(() => {
              atualizarFiltro("busca", valor || null)
            }, 400)
            return () => clearTimeout(timeout)
          }}
        />
      </div>

      <Select
        value={searchParams.get("status") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("status", valor || null)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {opcoesStatus.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {temFiltros && (
        <Button variant="ghost" size="sm" onClick={limparFiltros}>
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
