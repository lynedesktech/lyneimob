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
import { labelsTipoImovel, labelsFinalidade } from "@/lib/constantes"

type Props = {
  slug: string
}

export function FiltrosImoveisPublico({ slug }: Props) {
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

      router.push(`/${slug}/imoveis?${params.toString()}`)
    },
    [router, searchParams, slug]
  )

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
      {/* Busca */}
      <div className="col-span-2 space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Busca</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por bairro, cidade..."
            className="pl-10"
            defaultValue={searchParams.get("busca") ?? ""}
            onChange={(e) => {
              const valor = e.target.value
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
              timeoutRef.current = setTimeout(() => atualizarFiltro("busca", valor), 500)
            }}
          />
        </div>
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Tipo</p>
        <Select
          defaultValue={searchParams.get("tipo") ?? "todos"}
          onValueChange={(valor) => atualizarFiltro("tipo", valor)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(labelsTipoImovel).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Finalidade */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Finalidade</p>
        <Select
          defaultValue={searchParams.get("finalidade") ?? "todos"}
          onValueChange={(valor) => atualizarFiltro("finalidade", valor)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Finalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {Object.entries(labelsFinalidade).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quartos */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Quartos</p>
        <Select
          defaultValue={searchParams.get("quartos") ?? "todos"}
          onValueChange={(valor) => atualizarFiltro("quartos", valor)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Quartos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="1">1+ quarto</SelectItem>
            <SelectItem value="2">2+ quartos</SelectItem>
            <SelectItem value="3">3+ quartos</SelectItem>
            <SelectItem value="4">4+ quartos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Valor mínimo */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Valor mín.</p>
        <Input
          type="number"
          placeholder="R$ min"
          className="w-full"
          defaultValue={searchParams.get("preco_min") ?? ""}
          onChange={(e) => {
            const valor = e.target.value
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => atualizarFiltro("preco_min", valor || null), 800)
          }}
        />
      </div>

      {/* Valor máximo */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Valor máx.</p>
        <Input
          type="number"
          placeholder="R$ max"
          className="w-full"
          defaultValue={searchParams.get("preco_max") ?? ""}
          onChange={(e) => {
            const valor = e.target.value
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => atualizarFiltro("preco_max", valor || null), 800)
          }}
        />
      </div>
    </div>
  )
}
