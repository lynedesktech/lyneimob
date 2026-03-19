"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Handshake,
  Users,
  Building2,
  CalendarCheck,
  Settings,
  Building,
  MapPin,
  HelpCircle,
  ClipboardList,
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
import type { Acao, PerfilPlataforma } from "@/lib/permissoes"
import { temPermissao } from "@/lib/permissoes"

type Cargo = "admin" | "corretor" | "gerente"

type ItemNavegacao = {
  titulo: string
  href: string
  icone: React.ComponentType<React.SVGProps<SVGSVGElement>>
  permissao?: Acao
}

type GrupoNavegacao = {
  titulo?: string
  itens: ItemNavegacao[]
}

const gruposNavegacao: GrupoNavegacao[] = [
  {
    itens: [
      { titulo: "Dashboard", href: "/painel", icone: LayoutDashboard },
      { titulo: "Negócios", href: "/negocios", icone: Handshake },
      { titulo: "Clientes", href: "/clientes", icone: Users },
      { titulo: "Imóveis", href: "/imoveis", icone: Building2 },
      { titulo: "Loteamentos", href: "/loteamentos", icone: MapPin },
      { titulo: "Atividades", href: "/atividades", icone: CalendarCheck },
      { titulo: "Configurações", href: "/configuracoes", icone: Settings, permissao: "ver_configuracoes" },
      { titulo: "Ajuda", href: "/ajuda", icone: HelpCircle },
    ],
  },
]

const gruposSuperAdmin: GrupoNavegacao[] = [
  {
    itens: [
      { titulo: "Dashboard", href: "/painel", icone: LayoutDashboard },
      { titulo: "Organizações", href: "/admin/organizacoes", icone: Building },
      { titulo: "Usuários", href: "/admin/usuarios", icone: UsersRound },
      { titulo: "Roadmap", href: "/admin/roadmap", icone: ClipboardList },
      { titulo: "Configurações", href: "/configuracoes", icone: Settings },
    ],
  },
]

const gruposDesenvolvedor: GrupoNavegacao[] = [
  {
    itens: [
      { titulo: "Dashboard", href: "/painel", icone: LayoutDashboard },
      { titulo: "Organizações", href: "/admin/organizacoes", icone: Building },
      { titulo: "Usuários", href: "/admin/usuarios", icone: UsersRound },
      { titulo: "Roadmap", href: "/admin/roadmap", icone: ClipboardList },
      { titulo: "Configurações", href: "/configuracoes", icone: Settings },
    ],
  },
]

const gruposInvestidor: GrupoNavegacao[] = [
  {
    itens: [
      { titulo: "Dashboard", href: "/painel", icone: LayoutDashboard },
      { titulo: "Organizações", href: "/admin/organizacoes", icone: Building },
    ],
  },
]

const LABELS_PERFIL: Record<string, string> = {
  super_admin: "Super Admin",
  desenvolvedor: "Desenvolvedor",
  investidor: "Investidor",
}

interface AppSidebarProps {
  usuario: {
    nome: string
    email: string
    avatar_url?: string | null
    cargo?: string | null
    super_admin?: boolean | null
    perfil_plataforma?: PerfilPlataforma
  }
  organizacao: {
    nome: string
  }
}

export function AppSidebar({ usuario, organizacao }: AppSidebarProps) {
  const pathname = usePathname()
  const cargo = (usuario.cargo as Cargo) || "corretor"
  const perfilPlataforma = usuario.perfil_plataforma ?? (usuario.super_admin ? "super_admin" : null)

  // Selecionar sidebar baseada no perfil de plataforma
  let todosGrupos: GrupoNavegacao[]
  if (perfilPlataforma === "super_admin") {
    todosGrupos = gruposSuperAdmin
  } else if (perfilPlataforma === "desenvolvedor") {
    todosGrupos = gruposDesenvolvedor
  } else if (perfilPlataforma === "investidor") {
    todosGrupos = gruposInvestidor
  } else {
    todosGrupos = gruposNavegacao
  }

  const labelPerfil = perfilPlataforma
    ? LABELS_PERFIL[perfilPlataforma] ?? perfilPlataforma
    : "Gestão Imobiliária"

  return (
    <Sidebar className="border-r-0">
      {/* Header — ícone + nome da org + descrição */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              {organizacao.nome}
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              {labelPerfil}
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navegação agrupada */}
      <SidebarContent>
        {todosGrupos.map((grupo, indice) => {
          const itensVisiveis = grupo.itens.filter(
            (item) => !item.permissao || temPermissao(cargo, item.permissao, perfilPlataforma)
          )

          if (itensVisiveis.length === 0) return null

          return (
            <React.Fragment key={grupo.titulo ?? `grupo-${indice}`}>
              <SidebarGroup>
                {grupo.titulo && (
                  <SidebarGroupLabel className="text-sidebar-foreground/60 text-[11px] uppercase tracking-wider">
                    {grupo.titulo}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu {...(indice === 0 ? { id: "onborda-sidebar-nav" } : {})}>
                    {itensVisiveis.map((item) => {
                      const ativo =
                        item.href === "/painel"
                          ? pathname === "/painel"
                          : pathname.startsWith(item.href)

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            render={<Link href={item.href} />}
                            isActive={ativo}
                            tooltip={item.titulo}
                            className={ativo ? "font-semibold text-sidebar-primary" : ""}
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
            </React.Fragment>
          )
        })}
      </SidebarContent>

      {/* Footer com menu do usuário */}
      <SidebarFooter>
        <UsuarioMenu usuario={usuario} />
      </SidebarFooter>
    </Sidebar>
  )
}
