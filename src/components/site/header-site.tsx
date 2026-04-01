"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import type { OrganizacaoSite } from "@/lib/site/buscar-dados-site"

type Props = {
  organizacao: OrganizacaoSite
  temLoteamentos?: boolean
}

export function HeaderSite({ organizacao, temLoteamentos }: Props) {
  const links = [
    { href: `/${organizacao.slug}`, label: "Início" },
    { href: `/${organizacao.slug}/imoveis`, label: "Imóveis" },
    ...(temLoteamentos
      ? [{ href: `/${organizacao.slug}/loteamentos`, label: "Loteamentos" }]
      : []),
    { href: `/${organizacao.slug}/sobre`, label: "Sobre" },
    { href: `/${organizacao.slug}/contato`, label: "Contato" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href={`/${organizacao.slug}`}
          className="flex items-center gap-2.5"
        >
          {organizacao.logo_url ? (
            <Image
              src={organizacao.logo_url}
              alt={organizacao.nome}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-lg font-bold text-[var(--site-primaria)]">
              {organizacao.nome}
            </span>
          )}
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-6 sm:flex">
          {links.map((link) =>
            link.label === "Contato" ? (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md bg-[var(--site-primaria)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--site-primaria)]/90"
              >
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--site-primaria)]"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Menu hamburger mobile */}
        <Sheet>
          <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">
                {organizacao.logo_url ? (
                  <Image
                    src={organizacao.logo_url}
                    alt={organizacao.nome}
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <span className="text-[var(--site-primaria)]">{organizacao.nome}</span>
                )}
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {links.map((link) => (
                <SheetClose key={link.href} render={<Link href={link.href} />}>
                  <span className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    {link.label}
                  </span>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
