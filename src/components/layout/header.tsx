"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AlternadorTema } from "@/components/layout/alternador-tema"
import { GatilhoBuscaGlobal } from "@/components/layout/busca-global"

interface HeaderProps {
  organizacao: {
    nome: string
  }
}

export function Header({ organizacao }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
        {organizacao.nome}
      </span>
      <div className="flex-1 flex justify-center sm:justify-end sm:flex-none sm:ml-auto sm:mr-2">
        <GatilhoBuscaGlobal />
      </div>
      <AlternadorTema />
    </header>
  )
}
