import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { ehPerfilPlataforma } from "@/lib/permissoes"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { MODO_PRODUTO_UNICO } from "@/lib/produto"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Em modo produto unico (Duna), area /admin/* fica desligada
  if (MODO_PRODUTO_UNICO) redirect("/painel")

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
