import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { ehPerfilPlataforma } from "@/lib/permissoes"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await obterUsuarioAutenticado()
    if (!user) redirect("/login")

    const usuario = await obterDadosUsuario(user.id)
    if (!ehPerfilPlataforma(usuario)) redirect("/painel")

    return <>{children}</>
  } catch (erro) {
    if (isRedirectError(erro)) throw erro
    redirect("/login")
  }
}
