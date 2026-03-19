import { criarClienteServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormularioConfiguracoesOrganizacao } from "@/components/configuracoes/formulario-configuracoes-organizacao"

export default async function ConfiguracoesEmpresaPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("organizacao_id, cargo, super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (!usuario) redirect("/login")
  if (usuario.perfil_plataforma) redirect("/admin/configuracoes")
  if (usuario.cargo !== "admin") redirect("/configuracoes")

  const { data: organizacao } = await supabase
    .from("organizacoes")
    .select("id, nome, telefone, email, endereco, creci, whatsapp_numero")
    .eq("id", usuario.organizacao_id)
    .single()

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
