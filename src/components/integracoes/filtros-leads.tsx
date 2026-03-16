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
import type { FiltrosLeadsInput } from "@/types/leads-portais"

interface FiltrosLeadsProps {
  filtros: FiltrosLeadsInput
  onFiltrar: (filtros: FiltrosLeadsInput) => void
}

export function FiltrosLeads({ filtros, onFiltrar }: FiltrosLeadsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Busca */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          className="pl-9"
          value={filtros.busca || ""}
          onChange={(e) =>
            onFiltrar({ ...filtros, busca: e.target.value || undefined, pagina: 1 })
          }
        />
      </div>

      {/* Portal */}
      <Select
        value={filtros.portal || "todos"}
        onValueChange={(valor) =>
          onFiltrar({
            ...filtros,
            portal: valor === "todos" ? undefined : valor as FiltrosLeadsInput["portal"],
            pagina: 1,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Portal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os portais</SelectItem>
          <SelectItem value="zap">ZAP</SelectItem>
          <SelectItem value="olx">OLX</SelectItem>
          <SelectItem value="vivareal">VivaReal</SelectItem>
          <SelectItem value="imovelweb">Imovelweb</SelectItem>
          <SelectItem value="site">Site</SelectItem>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
          <SelectItem value="outro">Outro</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filtros.status || "todos"}
        onValueChange={(valor) =>
          onFiltrar({
            ...filtros,
            status: valor === "todos" ? undefined : valor as FiltrosLeadsInput["status"],
            pagina: 1,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          <SelectItem value="novo">Novos</SelectItem>
          <SelectItem value="processado">Processados</SelectItem>
          <SelectItem value="descartado">Descartados</SelectItem>
          <SelectItem value="erro">Com erro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
