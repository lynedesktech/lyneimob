import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { temPermissao } from "@/lib/permissoes"
import { IntegracoesConteudo } from "@/components/integracoes/integracoes-conteudo"

export default async function IntegracoesPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo")
    .eq("id", user.id)
    .single()

  if (!usuario) redirect("/login")

  // Apenas admin e gerente podem acessar Integrações
  if (!temPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "ver_integracoes")) {
    redirect("/")
  }

  return <IntegracoesConteudo />
}
