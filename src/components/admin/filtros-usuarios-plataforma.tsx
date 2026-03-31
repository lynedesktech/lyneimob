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

const opcoesCargo = [
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "corretor", label: "Corretor" },
]

const opcoesStatus = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
]

interface FiltrosUsuariosPlataformaProps {
  organizacoes: { id: string; nome: string }[]
}

export function FiltrosUsuariosPlataforma({ organizacoes }: FiltrosUsuariosPlataformaProps) {
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
      router.push(`/admin/usuarios?${params.toString()}`)
    },
    [router, searchParams]
  )

  const limparFiltros = useCallback(() => {
    router.push("/admin/usuarios")
  }, [router])

  const temFiltros =
    searchParams.has("busca") ||
    searchParams.has("cargo") ||
    searchParams.has("organizacao") ||
    searchParams.has("status")

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-[240px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
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
        value={searchParams.get("cargo") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("cargo", valor || null)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Cargo" />
        </SelectTrigger>
        <SelectContent>
          {opcoesCargo.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {organizacoes.length > 0 && (
        <Select
          value={searchParams.get("organizacao") ?? undefined}
          onValueChange={(valor) => atualizarFiltro("organizacao", valor || null)}
          items={organizacoes.map((org) => ({ value: org.id, label: org.nome }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Organização" />
          </SelectTrigger>
          <SelectContent>
            {organizacoes.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={searchParams.get("status") ?? undefined}
        onValueChange={(valor) => atualizarFiltro("status", valor || null)}
      >
        <SelectTrigger className="w-[130px]">
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
