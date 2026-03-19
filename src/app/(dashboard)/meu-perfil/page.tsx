import { criarClienteServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FormularioMeuPerfil } from "@/components/meu-perfil/formulario-meu-perfil"

export default async function PaginaMeuPerfil() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("id, nome, email, telefone, cargo, avatar_url, creci, bio, created_at, super_admin")
    .eq("id", user.id)
    .single()

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
