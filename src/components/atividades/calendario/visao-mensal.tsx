"use client"

import { useMemo } from "react"
import Link from "next/link"
import { labelsTipoAtividade, coresTipoAtividade } from "@/lib/constantes"
import type { AtividadeComRelacoes } from "@/types/database"

interface VisaoMensalProps {
  atividades: AtividadeComRelacoes[]
  dataAtual: Date
}

const coresTipo = coresTipoAtividade

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function VisaoMensal({ atividades, dataAtual }: VisaoMensalProps) {
  const { semanas, mesAtual } = useMemo(() => {
    const ano = dataAtual.getFullYear()
    const mes = dataAtual.getMonth()
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)

    // Achar o domingo antes do primeiro dia do mês
    const inicio = new Date(primeiroDia)
    inicio.setDate(inicio.getDate() - inicio.getDay())

    // Achar o sábado depois do último dia do mês
    const fim = new Date(ultimoDia)
    fim.setDate(fim.getDate() + (6 - fim.getDay()))

    const semanas: Date[][] = []
    const cursor = new Date(inicio)

    while (cursor <= fim) {
      const semana: Date[] = []
      for (let i = 0; i < 7; i++) {
        semana.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      semanas.push(semana)
    }

    return { semanas, mesAtual: mes }
  }, [dataAtual])

  // Agrupar atividades por dia
  const atividadesPorDia = useMemo(() => {
    const mapa = new Map<string, AtividadeComRelacoes[]>()
    for (const a of atividades) {
      const chave = new Date(a.data_inicio).toDateString()
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave)!.push(a)
    }
    return mapa
  }, [atividades])

  const hoje = new Date().toDateString()

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Header dias da semana */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {diasSemana.map((dia) => (
          <div
            key={dia}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      {semanas.map((semana, si) => (
        <div key={si} className="grid grid-cols-7 border-b last:border-b-0">
          {semana.map((dia) => {
            const chave = dia.toDateString()
            const eHoje = chave === hoje
            const eMesAtual = dia.getMonth() === mesAtual
            const atividadesDoDia = atividadesPorDia.get(chave) || []
            const exibir = atividadesDoDia.slice(0, 3)
            const restante = atividadesDoDia.length - 3

            return (
              <div
                key={chave}
                className={`min-h-[100px] border-r p-1 last:border-r-0 ${
                  !eMesAtual ? "bg-muted/30" : ""
                } ${eHoje ? "bg-info/5" : ""}`}
              >
                <div
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    eHoje
                      ? "bg-primary font-bold text-primary-foreground"
                      : eMesAtual
                        ? "font-medium"
                        : "text-muted-foreground"
                  }`}
                >
                  {dia.getDate()}
                </div>

                <div className="space-y-0.5">
                  {exibir.map((a) => (
                    <Link
                      key={a.id}
                      href={`/atividades/${a.id}`}
                      className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight transition-colors ${
                        a.status === "concluida"
                          ? "bg-success/10 text-success line-through opacity-60"
                          : a.status === "cancelada"
                            ? "bg-muted text-muted-foreground line-through opacity-50"
                            : coresTipo[a.tipo] || coresTipo.outro
                      }`}
                      title={`${labelsTipoAtividade[a.tipo] || a.tipo}: ${a.titulo}`}
                    >
                      {a.titulo}
                    </Link>
                  ))}
                  {restante > 0 && (
                    <p className="px-1.5 text-[10px] text-muted-foreground">
                      +{restante} mais
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
