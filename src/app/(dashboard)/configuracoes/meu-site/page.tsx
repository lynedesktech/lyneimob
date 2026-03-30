import { obterUsuarioAutenticado, obterDadosUsuario, obterOrganizacao } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { temPermissao } from "@/lib/permissoes"
import { buscarDominioOrganizacao } from "@/lib/site/buscar-dados-site"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormularioConfiguracoesSite } from "@/components/meu-site/formulario-configuracoes-site"
import type { Organizacao } from "@/types/database"

export default async function ConfiguracoesMeuSitePage() {
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)
  if (!usuario) redirect("/login")
  if (usuario.perfil_plataforma) redirect("/admin/configuracoes")

  if (!temPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_site")) {
    redirect("/configuracoes")
  }

  const organizacao = await obterOrganizacao(usuario.organizacao_id)
  if (!organizacao) redirect("/login")

  const dominio = await buscarDominioOrganizacao(organizacao.id)

  let appHostname = "localhost"
  try {
    appHostname = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").hostname
  } catch {}

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/configuracoes" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Configurações
      </Button>

      <FormularioConfiguracoesSite
        organizacao={organizacao as Organizacao}
        dominio={dominio}
        appHostname={appHostname}
      />
    </div>
  )
}
