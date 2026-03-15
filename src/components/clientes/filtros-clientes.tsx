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
  { value: "comprador", label: "Comprador" },
  { value: "vendedor", label: "Vendedor" },
  { value: "locatario", label: "Locatário" },
  { value: "proprietario", label: "Proprietário" },
]

const opcoesOrigem = [
  { value: "indicacao", label: "Indicação" },
  { value: "portal", label: "Portal" },
  { value: "site", label: "Site" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "outro", label: "Outro" },
]

const opcoesStatus = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "negociando", label: "Negociando" },
  { value: "fechado", label: "Fechado" },
]

export function FiltrosClientes() {
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
      router.push(`/clientes?${params.toString()}`)
    },
    [router, searchParams]
  )

  const limparFiltros = useCallback(() => {
    router.push("/clientes")
  }, [router])

  const temFiltros =
    searchParams.has("busca") ||
    searchParams.has("tipo") ||
    searchParams.has("origem") ||
    searchParams.has("status")

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
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
        value={searchParams.get("origem") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("origem", valor || null)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          {opcoesOrigem.map((opcao) => (
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
