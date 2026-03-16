import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioConfiguracoesSite } from "@/components/meu-site/formulario-configuracoes-site"
import { redirect } from "next/navigation"
import { temPermissao } from "@/lib/permissoes"
import { buscarDominioOrganizacao } from "@/lib/site/buscar-dados-site"
import type { Organizacao } from "@/types/database"

export default async function MeuSitePage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  if (!usuario) redirect("/login")

  // Apenas admin e gerente podem acessar Meu Site
  if (!temPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "gerenciar_site")) {
    redirect("/")
  }

  const { data: organizacao } = await supabase
    .from("organizacoes")
    .select("*")
    .eq("id", usuario.organizacao_id)
    .single()

  if (!organizacao) redirect("/login")

  // Buscar domínio customizado da organização (se existir)
  const dominio = await buscarDominioOrganizacao(organizacao.id)

  // Hostname da app para instruções de DNS
  let appHostname = "localhost"
  try {
    appHostname = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").hostname
  } catch {}

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <FormularioConfiguracoesSite
        organizacao={organizacao as Organizacao}
        dominio={dominio}
        appHostname={appHostname}
      />
    </div>
  )
}
