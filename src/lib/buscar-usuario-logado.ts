import { criarClienteServer } from "@/lib/supabase/server"

export async function buscarUsuarioLogado() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, organizacao_id, cargo, super_admin")
    .eq("id", user.id)
    .single()

  return usuario
}
