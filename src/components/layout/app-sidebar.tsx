"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Handshake,
  Users,
  Building2,
  CalendarCheck,
  Plug,
  Globe,
  Settings,
  MessageCircle,
  CreditCard,
  UsersRound,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { UsuarioMenu } from "@/components/layout/usuario-menu"
import type { Acao } from "@/lib/permissoes"
import { temPermissao } from "@/lib/permissoes"

type Cargo = "admin" | "corretor" | "gerente"

type ItemNavegacao = {
  titulo: string
  href: string
  icone: React.ComponentType<React.SVGProps<SVGSVGElement>>
  permissao?: Acao
}

const itensNavegacao: ItemNavegacao[] = [
  { titulo: "Dashboard", href: "/", icone: LayoutDashboard },
  { titulo: "Negócios", href: "/negocios", icone: Handshake },
  { titulo: "Clientes", href: "/clientes", icone: Users },
  { titulo: "Imóveis", href: "/imoveis", icone: Building2 },
  { titulo: "Atividades", href: "/atividades", icone: CalendarCheck },
  { titulo: "Conversas", href: "/conversas", icone: MessageCircle, permissao: "ver_conversas_whatsapp" },
  { titulo: "Integrações", href: "/integracoes", icone: Plug, permissao: "ver_integracoes" },
  { titulo: "Meu Site", href: "/meu-site", icone: Globe, permissao: "gerenciar_site" },
  { titulo: "Equipe", href: "/usuarios", icone: UsersRound, permissao: "gerenciar_usuarios" },
  { titulo: "Planos", href: "/planos", icone: CreditCard, permissao: "gerenciar_plano" },
  { titulo: "Configurações", href: "/configuracoes", icone: Settings, permissao: "gerenciar_integracoes" },
]

interface AppSidebarProps {
  usuario: {
    nome: string
    email: string
    avatar_url?: string | null
    cargo?: string | null
  }
  organizacao: {
    nome: string
  }
}

export function AppSidebar({ usuario, organizacao }: AppSidebarProps) {
  const pathname = usePathname()
  const cargo = (usuario.cargo as Cargo) || "corretor"

  const itensVisiveis = itensNavegacao.filter(
    (item) => !item.permissao || temPermissao(cargo, item.permissao)
  )

  return (
    <Sidebar className="border-r-0">
      {/* Header com logo */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              LyneImob
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              {organizacao.nome}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navegação */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu id="onborda-sidebar-nav">
              {itensVisiveis.map((item) => {
                const ativo =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={ativo}
                      tooltip={item.titulo}
                    >
                      <item.icone />
                      <span>{item.titulo}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer com menu do usuário */}
      <SidebarFooter>
        <UsuarioMenu usuario={usuario} />
      </SidebarFooter>
    </Sidebar>
  )
}
