import { listarTarefasRoadmap, buscarResumoRoadmap } from "@/actions/roadmap"
import { CardsResumo } from "@/components/roadmap/cards-resumo"
import { ListaTarefas } from "@/components/roadmap/lista-tarefas"
import { DialogNovaTarefa } from "@/components/roadmap/dialog-nova-tarefa"

export default async function RoadmapPage() {
  const [tarefas, resumo] = await Promise.all([
    listarTarefasRoadmap(),
    buscarResumoRoadmap(),
  ])

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roadmap</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o progresso do desenvolvimento do LyneImob
          </p>
        </div>
        <DialogNovaTarefa />
      </div>

      {/* Cards de resumo */}
      <CardsResumo resumo={resumo} />

      {/* Barra com total geral */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{resumo.total_geral}</span>
        tarefas no total
        {resumo.total_concluido > 0 && (
          <>
            {" · "}
            <span className="text-success font-medium">
              {Math.round((resumo.total_concluido / resumo.total_geral) * 100)}%
            </span>
            concluído
          </>
        )}
      </div>

      {/* Lista de tarefas */}
      <ListaTarefas tarefas={tarefas} />
    </div>
  )
}
