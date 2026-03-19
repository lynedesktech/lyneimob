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

const opcoesPlano = [
  { value: "trial", label: "Essencial" },
  { value: "crm_ia", label: "Profissional" },
  { value: "crm_ia_sdr", label: "Completo" },
]

const opcoesStatus = [
  { value: "active", label: "Ativo" },
  { value: "trialing", label: "Trial" },
  { value: "past_due", label: "Atrasado" },
  { value: "canceled", label: "Cancelado" },
]

export function FiltrosOrganizacoes() {
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
      router.push(`/admin/organizacoes?${params.toString()}`)
    },
    [router, searchParams]
  )

  const limparFiltros = useCallback(() => {
    router.push("/admin/organizacoes")
  }, [router])

  const temFiltros =
    searchParams.has("busca") ||
    searchParams.has("plano") ||
    searchParams.has("status")

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-[240px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou slug..."
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
        value={searchParams.get("plano") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("plano", valor || null)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Plano" />
        </SelectTrigger>
        <SelectContent>
          {opcoesPlano.map((opcao) => (
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
        <SelectTrigger className="w-[140px]">
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
