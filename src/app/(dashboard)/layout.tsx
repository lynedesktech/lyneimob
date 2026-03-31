import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { BannerTrialLayout } from "@/components/planos/banner-trial-layout"
import { ProvedorBuscaGlobal, DialogBuscaGlobal } from "@/components/layout/busca-global"
import { ProvedorOnboarding } from "@/components/onboarding/provedor-onboarding"
import { ProvedorContextoIA } from "@/components/ia/contexto-ia"
import { WidgetIA } from "@/components/ia/widget-ia"
import { Providers } from "./providers"
import {
  obterUsuarioAutenticado,
  obterDadosUsuario,
  obterOrganizacao,
} from "@/lib/supabase/queries"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await obterUsuarioAutenticado()

    if (!user) {
      redirect("/login?erro=sessao-invalida")
    }

    const usuario = await obterDadosUsuario(user.id)

    if (!usuario) {
      redirect("/login?erro=usuario-nao-encontrado")
    }

    const organizacao = await obterOrganizacao(usuario.organizacao_id)

    if (!organizacao) {
      redirect("/login?erro=organizacao-nao-encontrada")
    }

  return (
    <Providers>
      <ProvedorOnboarding>
        <ProvedorBuscaGlobal superAdmin={!!usuario.perfil_plataforma}>
          <ProvedorContextoIA>
            <TooltipProvider>
              <SidebarProvider>
                <AppSidebar usuario={usuario} organizacao={organizacao} />
                <SidebarInset>
                  <Header organizacao={organizacao} />
                  <BannerTrialLayout
                    plano={organizacao.plano}
                    trialFimEm={organizacao.trial_fim_em}
                  />
                  <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</main>
                </SidebarInset>
              </SidebarProvider>
              <WidgetIA />
            </TooltipProvider>
            <DialogBuscaGlobal />
          </ProvedorContextoIA>
        </ProvedorBuscaGlobal>
      </ProvedorOnboarding>
    </Providers>
  )
  } catch (erro) {
    if (isRedirectError(erro)) throw erro
    redirect("/login?erro=sessao-invalida")
  }
}
