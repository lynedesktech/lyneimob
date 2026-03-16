"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  MoreHorizontal,
  User,
  Building2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { labelsTipoAtividade, coresPrioridade, labelsPrioridade, iconesTipoAtividade, coresTipoAtividadeDiaria } from "@/lib/constantes"
import type { AtividadeComRelacoes } from "@/types/database"

interface VisaoDiariaProps {
  atividades: AtividadeComRelacoes[]
  dataAtual: Date
}

const iconesTipo = iconesTipoAtividade
const coresTipo = coresTipoAtividadeDiaria

const HORA_INICIO = 7
const HORA_FIM = 21
const SLOT_ALTURA = 80 // px por hora (mais espaço para cards maiores)

export function VisaoDiaria({ atividades, dataAtual }: VisaoDiariaProps) {
  const horas = Array.from(
    { length: HORA_FIM - HORA_INICIO },
    (_, i) => HORA_INICIO + i
  )

  const hoje = new Date()
  const eHoje = dataAtual.toDateString() === hoje.toDateString()

  // Agrupar atividades por slot de hora
  const atividadesPorHora = useMemo(() => {
    const mapa = new Map<number, AtividadeComRelacoes[]>()
    for (const a of atividades) {
      const hora = new Date(a.data_inicio).getHours()
      const horaSlot = Math.max(Math.min(hora, HORA_FIM - 1), HORA_INICIO)
      if (!mapa.has(horaSlot)) mapa.set(horaSlot, [])
      mapa.get(horaSlot)!.push(a)
    }
    return mapa
  }, [atividades])

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative">
        {/* Linha "agora" */}
        {eHoje && hoje.getHours() >= HORA_INICIO && hoje.getHours() < HORA_FIM && (
          <div
            className="absolute left-0 right-0 z-10 border-t-2 border-destructive"
            style={{
              top: `${((hoje.getHours() - HORA_INICIO) + hoje.getMinutes() / 60) * SLOT_ALTURA}px`,
            }}
          >
            <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-destructive" />
            <span className="ml-3 rounded bg-destructive px-1 py-0.5 text-[10px] font-medium text-destructive-foreground">
              Agora
            </span>
          </div>
        )}

        {/* Slots de hora */}
        {horas.map((hora) => {
          const atividadesSlot = atividadesPorHora.get(hora) || []

          return (
            <div
              key={hora}
              className="grid grid-cols-[60px_1fr] border-b last:border-b-0"
              style={{ minHeight: `${SLOT_ALTURA}px` }}
            >
              {/* Label da hora */}
              <div className="flex items-start justify-end border-r px-2 pt-1">
                <span className="text-xs text-muted-foreground">
                  {String(hora).padStart(2, "0")}:00
                </span>
              </div>

              {/* Cards das atividades */}
              <div className="space-y-1 p-1">
                {atividadesSlot.map((a) => {
                  const Icone = iconesTipo[a.tipo] || MoreHorizontal
                  const formatHora = (d: string) =>
                    new Intl.DateTimeFormat("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(d))

                  return (
                    <Link
                      key={a.id}
                      href={`/atividades/${a.id}`}
                      className={`block rounded-lg border p-3 transition-colors hover:shadow-sm ${
                        a.status === "concluida"
                          ? "border-success/20 bg-success/5 opacity-70"
                          : a.status === "cancelada"
                            ? "border-border bg-muted opacity-50"
                            : coresTipo[a.tipo] || coresTipo.outro
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icone className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${
                              a.status === "cancelada" ? "line-through" : ""
                            }`}>
                              {a.titulo}
                            </p>
                            <span className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${coresPrioridade[a.prioridade]}`}>
                              {labelsPrioridade[a.prioridade]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatHora(a.data_inicio)}
                            {a.data_fim && ` — ${formatHora(a.data_fim)}`}
                            {" · "}
                            {labelsTipoAtividade[a.tipo]}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            {a.clientes && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {(a.clientes as Record<string, unknown>)?.nome as string}
                              </span>
                            )}
                            {a.imoveis && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {(a.imoveis as Record<string, unknown>)?.titulo as string}
                              </span>
                            )}
                          </div>
                        </div>
                        {a.status === "concluida" && (
                          <Badge variant="success" className="shrink-0 text-[10px]">
                            Concluída
                          </Badge>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
