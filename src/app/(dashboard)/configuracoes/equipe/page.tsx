import { redirect } from "next/navigation"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaginaUsuarios } from "@/components/usuarios/pagina-usuarios"

export default async function ConfiguracoesEquipePage() {
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)
  if (!usuario) redirect("/login")
  if (usuario.perfil_plataforma) redirect("/admin/configuracoes")

  // Apenas admin pode acessar a pagina de equipe
  if (usuario.cargo !== "admin") redirect("/configuracoes")

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/configuracoes" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Configurações
      </Button>

      <PaginaUsuarios
        ehAdmin={usuario.cargo === "admin"}
        usuarioLogadoId={usuario.id}
      />
    </div>
  )
}
