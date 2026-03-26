"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { criarClienteBrowser } from "@/lib/supabase/client"
import { useTiposAtividade } from "@/hooks/use-tipos-atividade"
import type { FiltrosAtividadesInput } from "@/types/atividades"

interface FiltrosAtividadesProps {
  filtros: FiltrosAtividadesInput
  onChange: (filtros: FiltrosAtividadesInput) => void
}

type UsuarioSimples = { id: string; nome: string }

export function FiltrosAtividades({ filtros, onChange }: FiltrosAtividadesProps) {
  const [usuarios, setUsuarios] = useState<UsuarioSimples[]>([])
  const { tipos } = useTiposAtividade()

  useEffect(() => {
    const supabase = criarClienteBrowser()
    supabase
      .from("usuarios")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => {
        setUsuarios((data as UsuarioSimples[]) || [])
      })
  }, [])

  const temFiltros =
    filtros.tipo || filtros.status || filtros.prioridade || filtros.responsavel_id || filtros.data_vencimento_inicio || filtros.data_vencimento_fim

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Tipo</Label>
        <Select
          value={filtros.tipo || "todos"}
          onValueChange={(v) =>
            onChange({ ...filtros, tipo: !v || v === "todos" ? undefined : v, pagina: 1 })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {tipos.map((tipo) => (
              <SelectItem key={tipo.id} value={tipo.slug}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: tipo.cor }}
                  />
                  {tipo.nome}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <Select
          value={filtros.status || "todos"}
          onValueChange={(v) =>
            onChange({ ...filtros, status: !v || v === "todos" ? undefined : v, pagina: 1 })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Prioridade</Label>
        <Select
          value={filtros.prioridade || "todos"}
          onValueChange={(v) =>
            onChange({ ...filtros, prioridade: !v || v === "todos" ? undefined : v, pagina: 1 })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Responsável</Label>
        <Select
          value={filtros.responsavel_id || "todos"}
          onValueChange={(v) =>
            onChange({ ...filtros, responsavel_id: !v || v === "todos" ? undefined : v, pagina: 1 })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">De</Label>
        <Input
          type="date"
          className="w-[150px]"
          value={filtros.data_vencimento_inicio || ""}
          onChange={(e) =>
            onChange({ ...filtros, data_vencimento_inicio: e.target.value || undefined, pagina: 1 })
          }
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Até</Label>
        <Input
          type="date"
          className="w-[150px]"
          value={filtros.data_vencimento_fim || ""}
          onChange={(e) =>
            onChange({ ...filtros, data_vencimento_fim: e.target.value || undefined, pagina: 1 })
          }
        />
      </div>

      {temFiltros && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ pagina: 1, por_pagina: 20 })}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  )
}
