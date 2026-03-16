import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { temPermissao } from "@/lib/permissoes"
import { ConexaoWhatsapp } from "@/components/conversas-whatsapp/conexao-whatsapp"
import { ConversasConteudo } from "@/components/conversas-whatsapp/conversas-conteudo"

export default async function ConversasPage() {
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

  // Apenas admin e gerente podem acessar Conversas
  if (!temPermissao(usuario.cargo as "admin" | "corretor" | "gerente", "ver_conversas_whatsapp")) {
    redirect("/")
  }

  return (
    <ConexaoWhatsapp>
      <ConversasConteudo />
    </ConexaoWhatsapp>
  )
}
