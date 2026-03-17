import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { ehSuperAdmin } from "@/lib/permissoes"

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
    .select("super_admin")
    .eq("id", user.id)
    .single()

  if (!ehSuperAdmin(usuario)) redirect("/painel")

  return <>{children}</>
}
