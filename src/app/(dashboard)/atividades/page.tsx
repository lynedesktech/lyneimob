"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus, CalendarCheck2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { TabelaAtividades } from "@/components/atividades/tabela-atividades"
import { FiltrosAtividades } from "@/components/atividades/filtros-atividades"
import { CalendarioAtividades } from "@/components/atividades/calendario/calendario-atividades"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { BotaoExportar } from "@/components/ui/botao-exportar"
import { ToggleVisualizacao, opcoesListaCalendario } from "@/components/ui/toggle-visualizacao"
import { useListaAtividades } from "@/hooks/use-lista-atividades"
import { useFiltrosListagem } from "@/hooks/use-filtros-listagem"
import type { FiltrosAtividadesInput } from "@/types/atividades"

export default function AtividadesPage() {
  const searchParams = useSearchParams()
  const modoExibicao = searchParams.get("view") === "calendario" ? "calendario" : "lista"

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
          descricao="Gerencie suas visitas, ligações e follow-ups"
          acoes={
            <>
              <ToggleVisualizacao
                rota="/atividades"
                padrao="lista"
                opcoes={opcoesListaCalendario}
              />
              <BotaoExportar
                modulo="atividades"
                filtros={{
                  tipo: filtros.tipo,
                  status: filtros.status,
                  prioridade: filtros.prioridade,
                  usuario_id: filtros.responsavel_id,
                  data_inicio: filtros.data_vencimento_inicio,
                  data_fim: filtros.data_vencimento_fim,
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

      {/* Filtros — sempre visíveis */}
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
            responsavel_id: filtros.responsavel_id,
          }}
        />
      ) : (
        <>
          {!carregando && atividades.length === 0 ? (
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
            <TabelaAtividades
              atividades={atividades}
              total={total}
              carregando={carregando}
              paginacao={
                <PaginacaoListagem
                  pagina={paginaAtual}
                  totalPaginas={totalPaginas}
                  onMudarPagina={irParaPagina}
                />
              }
            />
          )}
        </>
      )}
    </div>
  )
}
