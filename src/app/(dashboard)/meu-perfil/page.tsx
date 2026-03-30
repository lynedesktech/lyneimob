import { redirect } from "next/navigation"
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
    <div className="flex flex-1 flex-col gap-6 p-6">
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
