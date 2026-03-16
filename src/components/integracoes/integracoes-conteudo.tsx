"use client"

import { useState, useEffect } from "react"
import { Plug, Inbox } from "lucide-react"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { Button } from "@/components/ui/button"
import { PaginacaoListagem } from "@/components/ui/paginacao-listagem"
import { Skeleton } from "@/components/ui/skeleton"
import { FeedXmlInfo } from "@/components/integracoes/feed-xml-info"
import { WebhookInfo } from "@/components/integracoes/webhook-info"
import { CardLead } from "@/components/integracoes/card-lead"
import { FiltrosLeads } from "@/components/integracoes/filtros-leads"
import { ConfigDistribuicao } from "@/components/integracoes/config-distribuicao"
import { CargaCorretores } from "@/components/integracoes/carga-corretores"
import { useListaLeads } from "@/hooks/use-lista-leads"
import { useFiltrosListagem } from "@/hooks/use-filtros-listagem"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { FiltrosLeadsInput } from "@/types/leads-portais"

export function IntegracoesConteudo() {
  const [slug, setSlug] = useState<string | null>(null)
  const { filtros, setFiltros, paginaAtual, calcularTotalPaginas, irParaPagina } =
    useFiltrosListagem<FiltrosLeadsInput>({
      inicial: { pagina: 1, por_pagina: 20 },
    })

  const { leads, total, carregando } = useListaLeads(filtros)

  const totalPaginas = calcularTotalPaginas(total)

  // Buscar slug da organização
  useEffect(() => {
    async function buscarSlug() {
      const supabase = criarClienteBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("organizacao_id")
        .eq("id", user.id)
        .single()

      if (!usuario) return

      const { data: org } = await supabase
        .from("organizacoes")
        .select("slug")
        .eq("id", usuario.organizacao_id)
        .single()

      if (org) setSlug(org.slug)
    }

    buscarSlug()
  }, [])

  const leadsNovos = leads.filter((l) => l.status === "novo").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Plug className="h-6 w-6" />
          Integrações
        </h1>
        <p className="text-muted-foreground mt-1">
          Conecte seus imóveis aos portais e receba leads automaticamente.
        </p>
      </div>

      {/* Cards de configuração */}
      {slug ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FeedXmlInfo slug={slug} />
          <WebhookInfo slug={slug} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[220px]" />
          <Skeleton className="h-[220px]" />
        </div>
      )}

      {/* Distribuição de Leads */}
      <ConfigDistribuicao />
      <CargaCorretores />

      {/* Seção de leads */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Leads Recebidos
              {leadsNovos > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-info px-2 py-0.5 text-xs font-medium text-info-foreground">
                  {leadsNovos} {leadsNovos === 1 ? "novo" : "novos"}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "lead recebido" : "leads recebidos"} dos portais
            </p>
          </div>
        </div>

        {/* Filtros */}
        <FiltrosLeads filtros={filtros} onFiltrar={setFiltros} />

        {/* Lista de leads */}
        {carregando ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EstadoVazio
            icone={Inbox}
            titulo="Nenhum lead recebido"
            descricao="Configure a URL do webhook nos portais imobiliários para começar a receber leads automaticamente."
          />
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <CardLead key={lead.id} lead={lead} />
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
    </div>
  )
}
