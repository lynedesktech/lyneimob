import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConteudoTiposAtividadeConfig } from "@/components/configuracoes/conteudo-tipos-atividade-config"

export default async function ConfiguracoesTiposAtividadePage() {
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)
  if (!usuario) redirect("/login")
  if (usuario.perfil_plataforma) redirect("/admin/configuracoes")
  if (!["admin", "gerente"].includes(usuario.cargo)) redirect("/configuracoes")

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/configuracoes" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Configurações
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tipos de Atividade</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as categorias de atividades da sua equipe
        </p>
      </div>

      <ConteudoTiposAtividadeConfig />
    </div>
  )
}
