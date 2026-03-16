"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import type { FiltrosConversasInput } from "@/types/whatsapp"

interface FiltrosConversasProps {
  filtros: FiltrosConversasInput
  onFiltrar: (filtros: FiltrosConversasInput) => void
}

export function FiltrosConversas({ filtros, onFiltrar }: FiltrosConversasProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Busca */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou número..."
          className="pl-9"
          value={filtros.busca || ""}
          onChange={(e) =>
            onFiltrar({ ...filtros, busca: e.target.value || undefined, pagina: 1 })
          }
        />
      </div>

      {/* Status */}
      <Select
        value={filtros.status || "todos"}
        onValueChange={(valor) =>
          onFiltrar({
            ...filtros,
            status: valor === "todos" ? undefined : valor as FiltrosConversasInput["status"],
            pagina: 1,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          <SelectItem value="em_andamento">Em andamento</SelectItem>
          <SelectItem value="qualificado">Qualificado</SelectItem>
          <SelectItem value="encaminhado">Encaminhado</SelectItem>
          <SelectItem value="finalizado">Finalizado</SelectItem>
          <SelectItem value="arquivado">Arquivado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
