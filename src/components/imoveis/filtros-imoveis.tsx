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
import { labelsTipoImovel, labelsFinalidade, labelsStatusImovel } from "@/lib/constantes"

const opcoesTipo = Object.entries(labelsTipoImovel).map(([value, label]) => ({ value, label }))
const opcoesFinalidade = Object.entries(labelsFinalidade).map(([value, label]) => ({ value, label }))
const opcoesStatus = Object.entries(labelsStatusImovel).map(([value, label]) => ({ value, label }))

export function FiltrosImoveis() {
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
      router.push(`/imoveis?${params.toString()}`)
    },
    [router, searchParams]
  )

  const limparFiltros = useCallback(() => {
    router.push("/imoveis")
  }, [router])

  const temFiltros =
    searchParams.has("busca") ||
    searchParams.has("tipo") ||
    searchParams.has("finalidade") ||
    searchParams.has("status") ||
    searchParams.has("canal")

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, código ou bairro..."
          className="pl-8"
          defaultValue={searchParams.get("busca") ?? ""}
          onChange={(e) => {
            const valor = e.target.value
            // Debounce simples
            const timeout = setTimeout(() => {
              atualizarFiltro("busca", valor || null)
            }, 400)
            return () => clearTimeout(timeout)
          }}
        />
      </div>

      <Select
        value={searchParams.get("tipo") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("tipo", valor || null)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          {opcoesTipo.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("finalidade") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("finalidade", valor || null)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Finalidade" />
        </SelectTrigger>
        <SelectContent>
          {opcoesFinalidade.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("status", valor || null)}
      >
        <SelectTrigger className="w-[150px]">
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

      <Select
        value={searchParams.get("canal") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("canal", valor || null)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="site">Site</SelectItem>
          <SelectItem value="portais">Portais</SelectItem>
          <SelectItem value="nenhum">Não publicado</SelectItem>
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
