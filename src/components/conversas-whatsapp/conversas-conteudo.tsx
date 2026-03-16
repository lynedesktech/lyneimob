"use client"

import { MessageCircle } from "lucide-react"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { CardConversa } from "@/components/conversas-whatsapp/card-conversa"
import { FiltrosConversas } from "@/components/conversas-whatsapp/filtros-conversas"
import { useListaConversas } from "@/hooks/use-lista-conversas"
import { useFiltrosListagem } from "@/hooks/use-filtros-listagem"
import type { FiltrosConversasInput } from "@/types/whatsapp"

export function ConversasConteudo() {
  const { filtros, setFiltros, paginaAtual, calcularTotalPaginas, irParaPagina } =
    useFiltrosListagem<FiltrosConversasInput>({
      inicial: { pagina: 1, por_pagina: 20 },
    })

  const { conversas, total, carregando } = useListaConversas(filtros)

  const totalPaginas = calcularTotalPaginas(total)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversas WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          {total} conversa{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filtros */}
      <FiltrosConversas filtros={filtros} onFiltrar={setFiltros} />

      {/* Lista */}
      {carregando ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : conversas.length === 0 ? (
        <EstadoVazio
          icone={MessageCircle}
          titulo="Nenhuma conversa encontrada"
          descricao="As conversas aparecerão aqui quando o agente WhatsApp receber mensagens."
        />
      ) : (
        <div className="space-y-2">
          {conversas.map((conversa) => (
            <CardConversa key={conversa.id} conversa={conversa} />
          ))}
        </div>
      )}

      {/* Paginação */}
      <PaginacaoListagem
        pagina={paginaAtual}
        totalPaginas={totalPaginas}
        onMudarPagina={irParaPagina}
      />
    </div>
  )
}
