import Link from "next/link"
import { headers } from "next/headers"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { KanbanContainer } from "@/components/negocios/kanban-container"
import { ListaNegocios } from "@/components/negocios/lista-negocios"
import { ToggleVisualizacao, opcoesKanbanLista } from "@/components/ui/toggle-visualizacao"

type SearchParams = Promise<{ visao?: string }>

export default async function NegociosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  // Detectar mobile pelo user-agent — em mobile, forçar lista por padrão
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") ?? ""
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)
  const padrao = isMobile ? "lista" : "kanban"

  const visao = params.visao === "lista" || params.visao === "kanban"
    ? params.visao
    : padrao

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Negócios"
        descricao="Acompanhe seu pipeline e feche mais negócios"
        acoes={
          <>
            <ToggleVisualizacao rota="/negocios" paramNome="visao" padrao={padrao} opcoes={opcoesKanbanLista} />
            <Button render={<Link href="/negocios/novo" />} id="onborda-btn-novo-negocio">
              <Plus className="mr-2 h-4 w-4" />
              Novo Negócio
            </Button>
          </>
        }
      />

      <div id="onborda-kanban">
        {visao === "lista" ? <ListaNegocios /> : <KanbanContainer />}
      </div>
    </div>
  )
}
