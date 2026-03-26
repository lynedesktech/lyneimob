"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { InputMonetario } from "@/components/ui/input-monetario"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { labelsTipoNegocio } from "@/lib/constantes"
import { criarClienteBrowser } from "@/lib/supabase/client"

interface FiltrosPipelineProps {
  filtros: {
    corretor_id?: string
    tipo?: string
    valor_min?: number
    valor_max?: number
  }
  onChange: (filtros: {
    corretor_id?: string
    tipo?: string
    valor_min?: number
    valor_max?: number
  }) => void
}

type CorretorSimples = { id: string; nome: string }

export function FiltrosPipeline({ filtros, onChange }: FiltrosPipelineProps) {
  const [corretores, setCorretores] = useState<CorretorSimples[]>([])

  useEffect(() => {
    const supabase = criarClienteBrowser()
    supabase
      .from("usuarios")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => {
        setCorretores((data as CorretorSimples[]) || [])
      })
  }, [])

  const temFiltros =
    filtros.corretor_id || filtros.tipo || filtros.valor_min || filtros.valor_max

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Corretor</Label>
        <Select
          value={filtros.corretor_id || "todos"}
          onValueChange={(v) =>
            onChange({ ...filtros, corretor_id: !v || v === "todos" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {corretores.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Tipo</Label>
        <Select
          value={filtros.tipo || "todos"}
          onValueChange={(v) =>
            onChange({ ...filtros, tipo: !v || v === "todos" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(labelsTipoNegocio).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 w-[160px]">
        <Label className="text-xs">Valor mín.</Label>
        <InputMonetario
          valor={filtros.valor_min ?? null}
          onValorChange={(v) =>
            onChange({ ...filtros, valor_min: v ?? undefined })
          }
        />
      </div>

      <div className="space-y-1 w-[160px]">
        <Label className="text-xs">Valor máx.</Label>
        <InputMonetario
          valor={filtros.valor_max ?? null}
          onValorChange={(v) =>
            onChange({ ...filtros, valor_max: v ?? undefined })
          }
        />
      </div>

      {temFiltros && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  )
}
