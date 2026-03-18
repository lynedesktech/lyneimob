"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

type Props = {
  slug: string
}

export function FiltrosLoteamentosPublico({ slug }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const atualizarFiltro = useCallback(
    (chave: string, valor: string | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (valor && valor !== "todos") {
        params.set(chave, valor)
      } else {
        params.delete(chave)
      }

      // Resetar paginação ao filtrar
      params.delete("pagina")

      router.push(`/${slug}/loteamentos?${params.toString()}`)
    },
    [router, searchParams, slug]
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, bairro, cidade..."
          className="pl-10"
          defaultValue={searchParams.get("busca") ?? ""}
          onChange={(e) => {
            const valor = e.target.value
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(
              () => atualizarFiltro("busca", valor),
              500
            )
          }}
        />
      </div>

      <Select
        defaultValue={searchParams.get("status") ?? "todos"}
        onValueChange={(valor) => atualizarFiltro("status", valor)}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          <SelectItem value="lancamento">Lançamento</SelectItem>
          <SelectItem value="em_vendas">Em Vendas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
