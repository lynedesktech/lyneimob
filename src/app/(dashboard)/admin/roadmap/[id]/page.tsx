import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buscarTarefaRoadmap } from "@/actions/roadmap"
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

  return (
    <div className="space-y-6">
      {/* Botão voltar */}
      <Button variant="ghost" size="sm" render={<Link href="/admin/roadmap" />}>
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Voltar
      </Button>

      {/* Conteúdo interativo (client component) */}
      <DetalheTarefaCliente tarefa={tarefa} />
    </div>
  )
}
