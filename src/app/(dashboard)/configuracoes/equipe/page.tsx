import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaginaUsuarios } from "@/components/usuarios/pagina-usuarios"

export default async function ConfiguracoesEquipePage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo, super_admin")
    .eq("id", user.id)
    .single()

  if (!usuario) redirect("/login")
  if (usuario.super_admin) redirect("/admin/configuracoes")

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/configuracoes" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Configurações
      </Button>

      <PaginaUsuarios
        ehAdmin={usuario.cargo === "admin"}
        usuarioLogadoId={usuario.id}
      />
    </div>
  )
}
