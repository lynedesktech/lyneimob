import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { criarClienteServer } from "@/lib/supabase/server"
import { ehInvestidor } from "@/lib/permissoes"
import type { PerfilPlataforma } from "@/lib/permissoes"
import { buscarTarefaRoadmap, buscarHistoricoTarefa, buscarUsuariosSuperAdmin } from "@/actions/roadmap"
import { DetalheTarefaCliente } from "@/components/roadmap/detalhe-tarefa-cliente"

type Params = Promise<{ id: string }>

export default async function DetalheTarefaPage({
  params,
}: {
  params: Params
}) {
  const supabase = await criarClienteServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (ehInvestidor(usuario as { perfil_plataforma?: PerfilPlataforma } | null)) {
    redirect("/painel")
  }

  const { id } = await params
  const [tarefa, historico, superAdmins] = await Promise.all([
    buscarTarefaRoadmap(id),
    buscarHistoricoTarefa(id),
    buscarUsuariosSuperAdmin(),
  ])

  if (!tarefa) redirect("/admin/roadmap")

  return (
    <div className="space-y-6">
      {/* Botão voltar */}
      <Button variant="ghost" size="sm" render={<Link href="/admin/roadmap" />}>
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Voltar
      </Button>

      {/* Conteúdo interativo (client component) */}
      <DetalheTarefaCliente tarefa={tarefa} historicoInicial={historico} superAdmins={superAdmins} />
    </div>
  )
}
