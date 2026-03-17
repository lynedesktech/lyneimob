import { criarClienteServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConteudoPipelineConfig } from "@/components/configuracoes/conteudo-pipeline-config"

export default async function ConfiguracoesPipelinePage() {
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
  if (!["admin", "gerente"].includes(usuario.cargo)) redirect("/configuracoes")

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/configuracoes" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Configurações
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as etapas do seu pipeline de negócios
        </p>
      </div>

      <ConteudoPipelineConfig />
    </div>
  )
}
