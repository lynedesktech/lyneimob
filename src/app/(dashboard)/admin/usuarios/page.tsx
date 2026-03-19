import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { ehSuperAdmin, ehDesenvolvedor } from "@/lib/permissoes"
import { listarUsuariosPlataforma } from "@/actions/usuarios-plataforma"
import { TabelaUsuariosPlataforma } from "@/components/admin/tabela-usuarios-plataforma"

export default async function AdminUsuariosPage() {
  const supabase = await criarClienteServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  // Apenas super_admin e desenvolvedor acessam
  if (!ehSuperAdmin(usuario) && !ehDesenvolvedor(usuario)) {
    redirect("/painel")
  }

  const podeMudarPerfil = ehSuperAdmin(usuario)
  const usuarios = await listarUsuariosPlataforma()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground">
          Todos os usuários cadastrados na plataforma.
        </p>
      </div>

      <TabelaUsuariosPlataforma
        usuarios={usuarios}
        podeMudarPerfil={podeMudarPerfil}
      />
    </div>
  )
}
