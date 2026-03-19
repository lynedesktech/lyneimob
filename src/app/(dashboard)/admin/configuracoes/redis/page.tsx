import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { criarClienteServer } from "@/lib/supabase/server"
import { ehSuperAdmin, ehDesenvolvedor } from "@/lib/permissoes"
import { Button } from "@/components/ui/button"
import { FormularioConfiguracoesIntegracoes } from "@/components/configuracoes/formulario-configuracoes-integracoes"
import { extrairIntegracoesMascaradas } from "@/types/configuracoes-integracoes"

export default async function AdminConfiguracoesRedisPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("organizacao_id, super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (!usuario || (!ehSuperAdmin(usuario) && !ehDesenvolvedor(usuario))) redirect("/configuracoes")

  const { data: organizacao } = await supabase
    .from("organizacoes")
    .select("configuracoes_integracoes")
    .eq("id", usuario.organizacao_id)
    .single()

  const integracoesMascaradas = extrairIntegracoesMascaradas(
    organizacao?.configuracoes_integracoes as Record<string, unknown> | null
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/configuracoes" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upstash Redis</h1>
          <p className="text-sm text-muted-foreground">
            Cache e memória de conversa do agente WhatsApp
          </p>
        </div>
      </div>

      <FormularioConfiguracoesIntegracoes
        integracoesMascaradas={integracoesMascaradas}
        ehAdmin={true}
        grupoFiltro="redis"
      />
    </div>
  )
}
