"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, List, CalendarDays, CalendarCheck2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { Skeleton } from "@/components/ui/skeleton"
import { CardAtividade } from "@/components/atividades/card-atividade"
import { FiltrosAtividades } from "@/components/atividades/filtros-atividades"
import { CalendarioAtividades } from "@/components/atividades/calendario/calendario-atividades"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { BotaoExportar } from "@/components/ui/botao-exportar"
import { useListaAtividades } from "@/hooks/use-lista-atividades"
import { useFiltrosListagem } from "@/hooks/use-filtros-listagem"
import type { FiltrosAtividadesInput } from "@/types/atividades"

type ModoExibicao = "lista" | "calendario"

export default function AtividadesPage() {
  const [modoExibicao, setModoExibicao] = useState<ModoExibicao>("lista")
  const { filtros, setFiltros, paginaAtual, calcularTotalPaginas, irParaPagina } =
    useFiltrosListagem<FiltrosAtividadesInput>({
      inicial: { pagina: 1, por_pagina: 20 },
    })

  const { atividades, total, carregando } = useListaAtividades(filtros)

  const totalPaginas = calcularTotalPaginas(total)

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <PageHeader
          titulo="Atividades"
          descricao={
            modoExibicao === "lista"
              ? `${total} atividade${total !== 1 ? "s" : ""} encontrada${total !== 1 ? "s" : ""}`
              : undefined
          }
          acoes={
            <>
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <Button
                  variant={modoExibicao === "lista" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setModoExibicao("lista")}
                  title="Visão lista"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={modoExibicao === "calendario" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setModoExibicao("calendario")}
                  title="Visão calendário"
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </div>
              <BotaoExportar
                modulo="atividades"
                filtros={{
                  tipo: filtros.tipo,
                  status: filtros.status,
                  prioridade: filtros.prioridade,
                  usuario_id: filtros.usuario_id,
                  data_inicio: filtros.data_inicio,
                  data_fim: filtros.data_fim,
                }}
                total={total}
              />
              <Button id="onborda-btn-nova-atividade" render={<Link href="/atividades/novo" />}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Button>
            </>
          }
        />
      </div>

      {/* Filtros */}
      <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
        <FiltrosAtividades filtros={filtros} onChange={setFiltros} />
      </div>

      {/* Conteúdo */}
      {modoExibicao === "calendario" ? (
        <CalendarioAtividades
          filtros={{
            tipo: filtros.tipo,
            status: filtros.status,
            prioridade: filtros.prioridade,
            usuario_id: filtros.usuario_id,
          }}
        />
      ) : (
        <>
          {/* Lista */}
          {carregando ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : atividades.length === 0 ? (
            <EstadoVazio
              icone={CalendarCheck2}
              titulo="Nenhuma atividade encontrada"
              descricao="Agende sua primeira visita, ligação ou follow-up"
              acao={
                <Button
                  variant="outline"
                  render={<Link href="/atividades/novo" />}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira atividade
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {atividades.map((atividade) => (
                <CardAtividade key={atividade.id} atividade={atividade} />
              ))}
            </div>
          )}

          {/* Paginação */}
          <PaginacaoListagem
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            onMudarPagina={irParaPagina}
          />
        </>
      )}
    </div>
  )
}
