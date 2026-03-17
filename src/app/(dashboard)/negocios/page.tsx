import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { KanbanContainer } from "@/components/negocios/kanban-container"
import { ListaNegocios } from "@/components/negocios/lista-negocios"
import { ToggleVisualizacao } from "@/components/negocios/toggle-visualizacao"

type SearchParams = Promise<{ visao?: string }>

export default async function NegociosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const visao = params.visao === "lista" ? "lista" : "kanban"

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Negócios"
        descricao="Acompanhe seu pipeline e feche mais negócios"
        acoes={
          <>
            <ToggleVisualizacao visaoAtual={visao} />
            <Button render={<Link href="/negocios/novo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Negócio
            </Button>
          </>
        }
      />

      {visao === "lista" ? <ListaNegocios /> : <KanbanContainer />}
    </div>
  )
}
