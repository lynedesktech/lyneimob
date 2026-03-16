"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { useAtividadesCalendario } from "@/hooks/use-atividades-calendario"
import { VisaoMensal } from "./visao-mensal"
import { VisaoSemanal } from "./visao-semanal"
import { VisaoDiaria } from "./visao-diaria"
import { Skeleton } from "@/components/ui/skeleton"

type ModoVisao = "dia" | "semana" | "mes"

interface CalendarioAtividadesProps {
  filtros?: {
    tipo?: string
    status?: string
    prioridade?: string
    usuario_id?: string
  }
}

function inicioSemana(data: Date): Date {
  const d = new Date(data)
  const dia = d.getDay()
  d.setDate(d.getDate() - dia)
  d.setHours(0, 0, 0, 0)
  return d
}

function fimSemana(data: Date): Date {
  const d = new Date(data)
  const dia = d.getDay()
  d.setDate(d.getDate() + (6 - dia))
  d.setHours(23, 59, 59, 999)
  return d
}

export function CalendarioAtividades({ filtros }: CalendarioAtividadesProps) {
  const [modoVisao, setModoVisao] = useState<ModoVisao>("mes")
  const [dataAtual, setDataAtual] = useState(new Date())

  // Calcular range de datas baseado no modo
  const range = useMemo(() => {
    const ano = dataAtual.getFullYear()
    const mes = dataAtual.getMonth()

    if (modoVisao === "mes") {
      // Pegar do primeiro domingo antes do mês até o último sábado depois
      const primeiroDia = new Date(ano, mes, 1)
      const ultimoDia = new Date(ano, mes + 1, 0)
      const inicio = inicioSemana(primeiroDia)
      const fim = fimSemana(ultimoDia)
      return {
        dataInicio: inicio.toISOString(),
        dataFim: fim.toISOString(),
      }
    }

    if (modoVisao === "semana") {
      return {
        dataInicio: inicioSemana(dataAtual).toISOString(),
        dataFim: fimSemana(dataAtual).toISOString(),
      }
    }

    // Dia
    const inicioDia = new Date(ano, mes, dataAtual.getDate(), 0, 0, 0)
    const fimDia = new Date(ano, mes, dataAtual.getDate(), 23, 59, 59)
    return {
      dataInicio: inicioDia.toISOString(),
      dataFim: fimDia.toISOString(),
    }
  }, [dataAtual, modoVisao])

  const { atividades, carregando } = useAtividadesCalendario({
    ...range,
    ...filtros,
  })

  // Navegação
  function navegar(direcao: number) {
    const nova = new Date(dataAtual)
    if (modoVisao === "mes") {
      nova.setMonth(nova.getMonth() + direcao)
    } else if (modoVisao === "semana") {
      nova.setDate(nova.getDate() + direcao * 7)
    } else {
      nova.setDate(nova.getDate() + direcao)
    }
    setDataAtual(nova)
  }

  function irParaHoje() {
    setDataAtual(new Date())
  }

  // Label do período atual
  const labelPeriodo = useMemo(() => {
    const opcoes: Intl.DateTimeFormatOptions = {}

    if (modoVisao === "mes") {
      opcoes.month = "long"
      opcoes.year = "numeric"
      return new Intl.DateTimeFormat("pt-BR", opcoes).format(dataAtual)
    }

    if (modoVisao === "semana") {
      const inicio = inicioSemana(dataAtual)
      const fim = fimSemana(dataAtual)
      const fmtInicio = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
      }).format(inicio)
      const fmtFim = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(fim)
      return `${fmtInicio} — ${fmtFim}`
    }

    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(dataAtual)
  }, [dataAtual, modoVisao])

  return (
    <div className="space-y-4">
      {/* Header do calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navegar(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={irParaHoje}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => navegar(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-lg font-semibold capitalize">
            {labelPeriodo}
          </h2>
        </div>

        {/* Seletor de modo */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {(["dia", "semana", "mes"] as ModoVisao[]).map((modo) => (
            <Button
              key={modo}
              variant={modoVisao === modo ? "default" : "ghost"}
              size="sm"
              className="text-xs"
              onClick={() => setModoVisao(modo)}
            >
              {modo === "dia" ? "Dia" : modo === "semana" ? "Semana" : "Mês"}
            </Button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="space-y-2">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      ) : atividades.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma atividade neste período
          </p>
        </div>
      ) : (
        <>
          {modoVisao === "mes" && (
            <VisaoMensal
              atividades={atividades}
              dataAtual={dataAtual}
            />
          )}
          {modoVisao === "semana" && (
            <VisaoSemanal
              atividades={atividades}
              dataAtual={dataAtual}
            />
          )}
          {modoVisao === "dia" && (
            <VisaoDiaria
              atividades={atividades}
              dataAtual={dataAtual}
            />
          )}
        </>
      )}
    </div>
  )
}
