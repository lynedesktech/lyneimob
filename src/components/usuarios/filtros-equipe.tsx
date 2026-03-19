"use client"

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

export type FiltrosEquipeValores = {
  busca: string
  cargo: string
  status: string
}

interface FiltrosEquipeProps {
  filtros: FiltrosEquipeValores
  onMudarFiltro: (chave: keyof FiltrosEquipeValores, valor: string) => void
  onLimpar: () => void
}

const opcoesCargo = [
  { value: "admin", label: "Admin" },
  { value: "gerente", label: "Gerente" },
  { value: "corretor", label: "Corretor" },
]

const opcoesStatus = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
]

export function FiltrosEquipe({ filtros, onMudarFiltro, onLimpar }: FiltrosEquipeProps) {
  const temFiltros = filtros.busca || filtros.cargo || filtros.status

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-[240px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          className="pl-8"
          value={filtros.busca}
          onChange={(e) => onMudarFiltro("busca", e.target.value)}
        />
      </div>

      <Select
        value={filtros.cargo || undefined}
        onValueChange={(valor) => onMudarFiltro("cargo", valor ?? "")}
      >
        <SelectTrigger className="w-[140px]">
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

      <Select
        value={filtros.status || undefined}
        onValueChange={(valor) => onMudarFiltro("status", valor ?? "")}
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
        <Button variant="ghost" size="sm" onClick={onLimpar}>
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
