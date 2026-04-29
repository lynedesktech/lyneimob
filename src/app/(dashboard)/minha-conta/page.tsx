import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { User, ShieldCheck, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"

const cardsMinhaConta: {
  titulo: string
  descricao: string
  href: string
  icone: React.ComponentType<React.SVGProps<SVGSVGElement>>
}[] = [
  {
    titulo: "Meu Perfil",
    descricao: "Nome, email, telefone, foto",
    href: "/minha-conta/meu-perfil",
    icone: User,
  },
  {
    titulo: "Segurança",
    descricao: "Altere sua senha com segurança",
    href: "/minha-conta/seguranca",
    icone: ShieldCheck,
  },
]

export default async function MinhaContaPage() {
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)
  if (!usuario) redirect("/login")

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-4 sm:p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as informações da sua conta
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cardsMinhaConta.map((card) => (
            <Link key={card.href} href={card.href} className="group">
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <card.icone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium leading-tight">{card.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{card.descricao}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
