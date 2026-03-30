import { redirect } from "next/navigation"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { ehInvestidor } from "@/lib/permissoes"
import type { PerfilPlataforma } from "@/lib/permissoes"
import { listarTarefasRoadmap, buscarUsuariosSuperAdmin } from "@/actions/roadmap"
import { ListaTarefas } from "@/components/roadmap/lista-tarefas"
import { DialogNovaTarefa } from "@/components/roadmap/dialog-nova-tarefa"

export default async function RoadmapPage() {
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)
  if (ehInvestidor(usuario as { perfil_plataforma?: PerfilPlataforma } | null)) {
    redirect("/painel")
  }

  const [tarefas, superAdmins] = await Promise.all([
    listarTarefasRoadmap(),
    buscarUsuariosSuperAdmin(),
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

      {/* Lista de tarefas */}
      <ListaTarefas tarefas={tarefas} superAdmins={superAdmins} />
    </div>
  )
}
