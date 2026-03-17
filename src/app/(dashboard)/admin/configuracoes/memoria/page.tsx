import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AcaoLimparMemoria } from "@/components/configuracoes/acao-limpar-memoria"

export default async function AdminConfiguracoesMemoriaPage() {
  const supabase = await criarClienteServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("super_admin")
    .eq("id", user.id)
    .single()

  if (!usuario?.super_admin) redirect("/configuracoes")

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/configuracoes" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Memória do Agente</h1>
          <p className="text-sm text-muted-foreground">
            Contexto de conversa armazenado no Redis
          </p>
        </div>
      </div>

      <AcaoLimparMemoria />
    </div>
  )
}
