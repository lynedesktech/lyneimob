import { criarClienteServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FormularioConfiguracoesOrganizacao } from "@/components/configuracoes/formulario-configuracoes-organizacao"
import { ShieldAlert } from "lucide-react"

export default async function ConfiguracoesPage() {
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

  // Super admin é redirecionado para a área de configurações da plataforma
  if (usuario.super_admin) {
    redirect("/admin/configuracoes")
  }

  // Apenas admin da org pode ver configurações
  if (usuario.cargo !== "admin") {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Apenas administradores podem acessar as configurações.
          Entre em contato com o administrador da sua imobiliária.
        </p>
      </div>
    )
  }

  // Buscar dados da organização para o formulário
  const { data: organizacao } = await supabase
    .from("organizacoes")
    .select("id, nome, telefone, email, endereco, creci, whatsapp_numero")
    .eq("id", usuario.organizacao_id)
    .single()

  if (!organizacao) redirect("/login")

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <FormularioConfiguracoesOrganizacao organizacao={organizacao} />
    </div>
  )
}
