import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioConfiguracoesIntegracoes } from "@/components/configuracoes/formulario-configuracoes-integracoes"
import { extrairIntegracoesMascaradas } from "@/types/configuracoes-integracoes"
import { redirect } from "next/navigation"

export default async function ConfiguracoesPage() {
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

  // Buscar configurações de integrações da organização
  const { data: organizacao } = await supabase
    .from("organizacoes")
    .select("id, configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  if (!organizacao) redirect("/login")

  // Mascarar chaves antes de enviar ao Client Component (segurança)
  const integracoesMascaradas = extrairIntegracoesMascaradas(
    organizacao.configuracoes_integracoes as Record<string, unknown> | null
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <FormularioConfiguracoesIntegracoes
        integracoesMascaradas={integracoesMascaradas}
        ehAdmin={usuario.cargo === "admin"}
      />
    </div>
  )
}
