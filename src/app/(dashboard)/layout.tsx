import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { Providers } from "./providers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await criarClienteServer()

  // Buscar usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar dados do usuário na tabela usuarios
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome, email, avatar_url, cargo")
    .eq("id", user.id)
    .single()

  if (!usuario) {
    redirect("/login")
  }

  // Buscar dados da organização
  const { data: organizacao } = await supabase
    .from("organizacoes")
    .select("nome, slug")
    .single()

  if (!organizacao) {
    redirect("/login")
  }

  return (
    <Providers>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar usuario={usuario} organizacao={organizacao} />
          <SidebarInset>
            <Header organizacao={organizacao} />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </Providers>
  )
}
