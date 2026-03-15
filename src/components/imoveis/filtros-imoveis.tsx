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

const opcoesTipo = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "sala_comercial", label: "Sala Comercial" },
  { value: "galpao", label: "Galpão" },
  { value: "cobertura", label: "Cobertura" },
  { value: "kitnet", label: "Kitnet" },
  { value: "fazenda", label: "Fazenda" },
  { value: "sitio", label: "Sítio" },
  { value: "loja", label: "Loja" },
  { value: "outro", label: "Outro" },
]

const opcoesFinalidade = [
  { value: "venda", label: "Venda" },
  { value: "aluguel", label: "Aluguel" },
  { value: "venda_e_aluguel", label: "Venda e Aluguel" },
]

const opcoesStatus = [
  { value: "disponivel", label: "Disponível" },
  { value: "reservado", label: "Reservado" },
  { value: "vendido", label: "Vendido" },
  { value: "alugado", label: "Alugado" },
  { value: "inativo", label: "Inativo" },
]

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
    searchParams.has("status")

  return (
    <div className="flex flex-wrap items-center gap-3">
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

      {temFiltros && (
        <Button variant="ghost" size="sm" onClick={limparFiltros}>
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
