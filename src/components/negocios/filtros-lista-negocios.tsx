"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
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
import { labelsTipoNegocio, labelsStatusNegocio } from "@/lib/constantes/negocios"
import { criarClienteBrowser } from "@/lib/supabase/client"

export interface FiltrosLista {
  busca?: string
  corretor_id?: string
  tipo?: string
  status?: string
  etapa_id?: string
  valor_min?: number
  valor_max?: number
}

interface FiltrosListaNegociosProps {
  filtros: FiltrosLista
  onChange: (filtros: FiltrosLista) => void
}

type CorretorSimples = { id: string; nome: string }
type EtapaSimples = { id: string; nome: string }

export function FiltrosListaNegocios({ filtros, onChange }: FiltrosListaNegociosProps) {
  const [corretores, setCorretores] = useState<CorretorSimples[]>([])
  const [etapas, setEtapas] = useState<EtapaSimples[]>([])

  useEffect(() => {
    async function carregar() {
      try {
        const supabase = criarClienteBrowser()
        const [resCorretores, resEtapas] = await Promise.all([
          supabase.from("usuarios").select("id, nome").eq("ativo", true).order("nome"),
          supabase.from("pipeline_etapas").select("id, nome").order("ordem"),
        ])
        setCorretores((resCorretores.data as CorretorSimples[]) || [])
        setEtapas((resEtapas.data as EtapaSimples[]) || [])
      } catch {
        setCorretores([])
        setEtapas([])
      }
    }
    carregar()
  }, [])

  const temFiltros =
    filtros.busca ||
    filtros.corretor_id ||
    filtros.tipo ||
    filtros.status ||
    filtros.etapa_id ||
    filtros.valor_min ||
    filtros.valor_max

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Buscar</Label>
        <Input
          type="text"
          placeholder="Título do negócio..."
          className="w-[200px]"
          value={filtros.busca || ""}
          onChange={(e) =>
            onChange({ ...filtros, busca: e.target.value || undefined })
          }
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <Select
          value={filtros.status || "todos"}
          onValueChange={(v) =>
            onChange({ ...filtros, status: !v || v === "todos" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(labelsStatusNegocio).map(([valor, label]) => (
              <SelectItem key={valor} value={valor}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Etapa</Label>
        <Select
          value={filtros.etapa_id || "todas"}
          onValueChange={(v) =>
            onChange({ ...filtros, etapa_id: !v || v === "todas" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {etapas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          <SelectTrigger className="w-[130px]">
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
