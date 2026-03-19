"use client"

import { useRouter } from "next/navigation"
import { LogOut, User, ChevronsUpDown, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { sair } from "@/actions/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from "@/components/ui/sidebar"

interface UsuarioMenuProps {
  usuario: {
    nome: string
    email: string
    avatar_url?: string | null
    cargo?: string | null
  }
}

function obterIniciais(nome: string): string {
  return nome
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function AvatarUsuario({ usuario, className }: { usuario: UsuarioMenuProps["usuario"]; className?: string }) {
  return (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={usuario.avatar_url ?? undefined} alt={usuario.nome} />
      <AvatarFallback className={cn("rounded-lg text-xs", className)}>
        {obterIniciais(usuario.nome)}
      </AvatarFallback>
    </Avatar>
  )
}

export function UsuarioMenu({ usuario }: UsuarioMenuProps) {
  const router = useRouter()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
              />
            }
          >
            <AvatarUsuario usuario={usuario} className="bg-sidebar-primary text-sidebar-primary-foreground" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-sidebar-foreground">
                {usuario.nome}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {usuario.email}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <AvatarUsuario usuario={usuario} />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{usuario.nome}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {usuario.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/meu-perfil")}>
                <User className="mr-2 h-4 w-4" />
                <span>Meu perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/financeiro")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Financeiro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => sair()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
