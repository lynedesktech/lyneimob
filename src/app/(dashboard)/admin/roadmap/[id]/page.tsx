import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buscarTarefaRoadmap } from "@/actions/roadmap"
import { STATUS_ROADMAP, PRIORIDADE_ROADMAP } from "@/types/roadmap"
import { DetalheTarefaCliente } from "@/components/roadmap/detalhe-tarefa-cliente"

type Params = Promise<{ id: string }>

export default async function DetalheTarefaPage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const tarefa = await buscarTarefaRoadmap(id)

  if (!tarefa) redirect("/admin/roadmap")

  const statusConfig = STATUS_ROADMAP[tarefa.status]
  const prioridadeConfig = PRIORIDADE_ROADMAP[tarefa.prioridade] ?? PRIORIDADE_ROADMAP.media

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/admin/roadmap" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{tarefa.titulo}</h1>
            <Badge variant={statusConfig.cor as "success" | "info" | "warning" | "secondary" | "outline"}>
              {statusConfig.label}
            </Badge>
            <Badge variant={prioridadeConfig.cor as "secondary" | "info" | "warning" | "destructive"}>
              {prioridadeConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Criada em{" "}
            {new Date(tarefa.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {tarefa.data_conclusao && (
              <>
                {" · Concluída em "}
                {new Date(tarefa.data_conclusao + "T00:00:00").toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Conteúdo interativo (client component) */}
      <DetalheTarefaCliente tarefa={tarefa} />
    </div>
  )
}
