import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioConfiguracoesIntegracoes } from "@/components/configuracoes/formulario-configuracoes-integracoes"
import { extrairIntegracoesMascaradas } from "@/types/configuracoes-integracoes"

export default async function AdminConfiguracoesPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("organizacao_id, super_admin")
    .eq("id", user.id)
    .single()

  if (!usuario?.super_admin) redirect("/painel")

  // Buscar configurações de integrações da organização do super_admin
  const { data: organizacao } = await supabase
    .from("organizacoes")
    .select("id, configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  if (!organizacao) redirect("/login")

  const integracoesMascaradas = extrairIntegracoesMascaradas(
    organizacao.configuracoes_integracoes as Record<string, unknown> | null
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <FormularioConfiguracoesIntegracoes
        integracoesMascaradas={integracoesMascaradas}
        ehAdmin={true}
      />
    </div>
  )
}
