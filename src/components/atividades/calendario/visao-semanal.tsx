"use client"

import { useMemo } from "react"
import Link from "next/link"
import { labelsTipoAtividade, coresTipoAtividadeSemanal } from "@/lib/constantes"
import type { AtividadeComRelacoes } from "@/types/database"

interface VisaoSemanalProps {
  atividades: AtividadeComRelacoes[]
  dataAtual: Date
}

const coresTipo = coresTipoAtividadeSemanal

const HORA_INICIO = 7
const HORA_FIM = 21
const TOTAL_HORAS = HORA_FIM - HORA_INICIO
const ALTURA_HORA = 60 // px por hora

export function VisaoSemanal({ atividades, dataAtual }: VisaoSemanalProps) {
  // Calcular dias da semana
  const diasSemana = useMemo(() => {
    const inicio = new Date(dataAtual)
    inicio.setDate(inicio.getDate() - inicio.getDay())
    const dias: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(inicio)
      d.setDate(d.getDate() + i)
      dias.push(d)
    }
    return dias
  }, [dataAtual])

  // Agrupar atividades por dia
  const atividadesPorDia = useMemo(() => {
    const mapa = new Map<string, AtividadeComRelacoes[]>()
    for (const a of atividades) {
      const chave = new Date(a.data_vencimento).toDateString()
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave)!.push(a)
    }
    return mapa
  }, [atividades])

  const hoje = new Date().toDateString()
  const agora = new Date()

  // Gerar labels de horas
  const horas = Array.from({ length: TOTAL_HORAS }, (_, i) => HORA_INICIO + i)

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Header com dias */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50">
        <div className="border-r p-2" />
        {diasSemana.map((dia) => {
          const eHoje = dia.toDateString() === hoje
          const nomeDia = new Intl.DateTimeFormat("pt-BR", {
            weekday: "short",
          }).format(dia)
          return (
            <div
              key={dia.toDateString()}
              className={`border-r p-2 text-center last:border-r-0 ${
                eHoje ? "bg-info/5" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground capitalize">
                {nomeDia}
              </p>
              <p
                className={`text-sm font-semibold ${
                  eHoje ? "text-primary" : ""
                }`}
              >
                {dia.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Grid de horas */}
      <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
        {/* Coluna de horas */}
        <div className="border-r">
          {horas.map((hora) => (
            <div
              key={hora}
              className="flex h-[60px] items-start justify-end border-b pr-2 pt-0.5"
            >
              <span className="text-[10px] text-muted-foreground">
                {String(hora).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Colunas dos dias */}
        {diasSemana.map((dia) => {
          const chave = dia.toDateString()
          const eHoje = chave === hoje
          const atividadesDoDia = atividadesPorDia.get(chave) || []

          return (
            <div
              key={chave}
              className={`relative border-r last:border-r-0 ${
                eHoje ? "bg-info/5" : ""
              }`}
            >
              {/* Linhas de hora */}
              {horas.map((hora) => (
                <div key={hora} className="h-[60px] border-b" />
              ))}

              {/* Linha "agora" */}
              {eHoje && agora.getHours() >= HORA_INICIO && agora.getHours() < HORA_FIM && (
                <div
                  className="absolute left-0 right-0 z-10 border-t-2 border-destructive"
                  style={{
                    top: `${((agora.getHours() - HORA_INICIO) + agora.getMinutes() / 60) * ALTURA_HORA}px`,
                  }}
                >
                  <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-destructive" />
                </div>
              )}

              {/* Atividades posicionadas */}
              {atividadesDoDia.map((a) => {
                const inicio = new Date(a.data_vencimento)
                const horaInicio = inicio.getHours() + inicio.getMinutes() / 60
                const fim = a.data_fim ? new Date(a.data_fim) : null
                const horaFim = fim
                  ? fim.getHours() + fim.getMinutes() / 60
                  : horaInicio + 1

                // Limitar ao range visível
                const topHora = Math.max(horaInicio, HORA_INICIO)
                const bottomHora = Math.min(horaFim, HORA_FIM)
                if (topHora >= HORA_FIM || bottomHora <= HORA_INICIO) return null

                const top = (topHora - HORA_INICIO) * ALTURA_HORA
                const height = Math.max((bottomHora - topHora) * ALTURA_HORA, 24)

                return (
                  <Link
                    key={a.id}
                    href={`/atividades/${a.id}`}
                    className={`absolute left-0.5 right-0.5 z-20 overflow-hidden rounded border p-1 text-[10px] leading-tight transition-opacity hover:opacity-80 ${
                      a.status === "concluida"
                        ? "border-success/30 bg-success/5 text-success opacity-60"
                        : a.status === "cancelada"
                          ? "border-border bg-muted text-muted-foreground opacity-50"
                          : coresTipo[a.tipo] || coresTipo.outro
                    }`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    title={`${labelsTipoAtividade[a.tipo] || a.tipo}: ${a.titulo}`}
                  >
                    <p className="truncate font-medium">{a.titulo}</p>
                    {height > 30 && a.clientes && (
                      <p className="truncate opacity-70">
                        {(a.clientes as Record<string, unknown>)?.nome as string}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
