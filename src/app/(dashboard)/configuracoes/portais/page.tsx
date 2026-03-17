import { criarClienteServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { temPermissao } from "@/lib/permissoes"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConteudoPortais } from "@/components/configuracoes/conteudo-portais"

export default async function ConfiguracoesPortaisPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("organizacao_id, cargo, super_admin")
    .eq("id", user.id)
    .single()

  if (!usuario) redirect("/login")
  if (usuario.super_admin) redirect("/admin/configuracoes")

  if (!temPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "ver_integracoes")) {
    redirect("/configuracoes")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/configuracoes" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Configurações
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portais Imobiliários</h1>
        <p className="text-sm text-muted-foreground">
          Feed XML, webhook e leads recebidos dos portais
        </p>
      </div>

      <ConteudoPortais />
    </div>
  )
}
