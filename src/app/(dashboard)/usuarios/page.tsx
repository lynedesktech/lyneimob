import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { PaginaUsuarios } from "@/components/usuarios/pagina-usuarios"

export default async function UsuariosPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  if (!usuario) {
    redirect("/login")
  }

  return (
    <PaginaUsuarios
      ehAdmin={usuario.cargo === "admin"}
      usuarioLogadoId={usuario.id}
    />
  )
}
