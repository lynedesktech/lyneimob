import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { ehPerfilPlataforma } from "@/lib/permissoes"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (!ehPerfilPlataforma(usuario)) redirect("/painel")

  return <>{children}</>
}
