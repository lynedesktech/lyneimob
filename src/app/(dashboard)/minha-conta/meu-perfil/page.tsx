import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { FormularioMeuPerfil } from "@/components/meu-perfil/formulario-meu-perfil"

export default async function PaginaMeuPerfil() {
  const user = await obterUsuarioAutenticado()

  if (!user) {
    redirect("/login")
  }

  const perfil = await obterDadosUsuario(user.id)

  if (!perfil) {
    redirect("/painel")
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/minha-conta" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Minha conta
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu perfil</h1>
        <p className="text-muted-foreground">
          Visualize e edite suas informações pessoais
        </p>
      </div>

      <FormularioMeuPerfil perfil={perfil} />
    </div>
  )
}
