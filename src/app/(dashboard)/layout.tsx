import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { BannerTrialLayout } from "@/components/planos/banner-trial-layout"
import { ProvedorBuscaGlobal, DialogBuscaGlobal } from "@/components/layout/busca-global"
import { ProvedorOnboarding } from "@/components/onboarding/provedor-onboarding"
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
    redirect("/login?erro=sessao-invalida")
  }

  // Buscar dados do usuário na tabela usuarios
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome, email, avatar_url, cargo, super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (!usuario) {
    redirect("/login?erro=usuario-nao-encontrado")
  }

  // Buscar dados da organização
  const { data: organizacao } = await supabase
    .from("organizacoes")
    .select("nome, slug, plano, trial_fim_em")
    .single()

  if (!organizacao) {
    redirect("/login?erro=organizacao-nao-encontrada")
  }

  return (
    <Providers>
      <ProvedorOnboarding>
        <ProvedorBuscaGlobal superAdmin={!!usuario.perfil_plataforma}>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar usuario={usuario} organizacao={organizacao} />
              <SidebarInset>
                <Header organizacao={organizacao} />
                <BannerTrialLayout
                  plano={organizacao.plano}
                  trialFimEm={organizacao.trial_fim_em}
                />
                <main className="flex-1 overflow-auto p-6">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
          <DialogBuscaGlobal />
        </ProvedorBuscaGlobal>
      </ProvedorOnboarding>
    </Providers>
  )
}
