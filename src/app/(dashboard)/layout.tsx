import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { MODO_PRODUTO_UNICO } from "@/lib/produto"
import { ProvedorBuscaGlobal, DialogBuscaGlobal } from "@/components/layout/busca-global"
import { ProvedorContextoIA } from "@/components/ia/contexto-ia"
import { WidgetIA } from "@/components/ia/widget-ia"
import { Providers } from "./providers"
import { extrairConfiguracoes } from "@/types/configuracoes-site"
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

  // Personalizacao visual por organizacao: logo + cores vem de configuracoes_site
  const configs = extrairConfiguracoes(
    (organizacao as unknown as { configuracoes_site?: Record<string, unknown> }).configuracoes_site
  )
  const orgComBranding = {
    nome: organizacao.nome,
    logo_url: (organizacao as unknown as { logo_url?: string | null }).logo_url ?? null,
    corPrimaria: configs.cores.primaria,
  }

  return (
    <Providers>
      <ProvedorBuscaGlobal superAdmin={!!usuario.perfil_plataforma}>
        <ProvedorContextoIA>
          <TooltipProvider>
            <div
              style={
                {
                  // Site publico — ja usado em [slug]/layout.tsx
                  "--site-primaria": configs.cores.primaria,
                  "--site-destaque": configs.cores.destaque,

                  // Dashboard — sobrescreve vars do shadcn com as cores da
                  // organizacao (LYNEDES-128). Pinta o sistema inteiro:
                  // botoes primarios, sidebar item ativo, badges, wizards,
                  // checkboxes, switches, progress bars, focus rings.
                  // Se a org nao tem cores custom, `configs.cores.primaria`
                  // cai pro default do schema (`#063A8C` azul LyneImob),
                  // mantendo consistencia com o site publico.
                  "--primary": configs.cores.primaria,
                  "--primary-foreground": "#FFFFFF",
                  "--sidebar-primary": configs.cores.primaria,
                  "--sidebar-primary-foreground": "#FFFFFF",
                  "--sidebar-accent-foreground": configs.cores.primaria,
                  "--ring": configs.cores.primaria,
                } as React.CSSProperties
              }
              className="contents"
            >
              <SidebarProvider>
                <AppSidebar usuario={usuario} organizacao={orgComBranding} />
                <SidebarInset className="bg-muted/40 dark:bg-sidebar">
                  <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm m-2 md:m-4">
                    <Header organizacao={organizacao} />
                    <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">{children}</main>
                  </div>
                </SidebarInset>
              </SidebarProvider>
              <WidgetIA />
            </div>
          </TooltipProvider>
          <DialogBuscaGlobal />
        </ProvedorContextoIA>
      </ProvedorBuscaGlobal>
    </Providers>
  )
  } catch (erro) {
    if (isRedirectError(erro)) throw erro
    redirect("/login?erro=sessao-invalida")
  }
}
