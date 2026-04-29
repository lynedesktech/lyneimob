import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { obterUsuarioAutenticado } from "@/lib/supabase/queries"
import { FormularioTrocarSenha } from "@/components/meu-perfil/formulario-trocar-senha"

export default async function PaginaSeguranca() {
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" render={<Link href="/minha-conta" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Minha conta
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Segurança</h1>
        <p className="text-sm text-muted-foreground">
          Altere sua senha com segurança
        </p>
      </div>

      <FormularioTrocarSenha />
    </div>
  )
}
