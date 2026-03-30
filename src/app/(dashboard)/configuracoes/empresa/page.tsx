import { obterUsuarioAutenticado, obterDadosUsuario, obterOrganizacao } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormularioConfiguracoesOrganizacao } from "@/components/configuracoes/formulario-configuracoes-organizacao"

export default async function ConfiguracoesEmpresaPage() {
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)
  if (!usuario) redirect("/login")
  if (usuario.perfil_plataforma) redirect("/admin/configuracoes")
  if (usuario.cargo !== "admin") redirect("/configuracoes")

  const organizacao = await obterOrganizacao(usuario.organizacao_id)
  if (!organizacao) redirect("/login")

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/configuracoes" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Configurações
      </Button>

      <FormularioConfiguracoesOrganizacao organizacao={organizacao} />
    </div>
  )
}
