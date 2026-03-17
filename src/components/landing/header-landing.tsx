"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const linksNavegacao = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Vídeo", href: "#video" },
  { label: "Preços", href: "#precos" },
  { label: "FAQ", href: "#faq" },
]

export function HeaderLanding() {
  const [scrollou, setScrollou] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollou(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrollou
          ? "bg-grad-end/95 shadow-lg shadow-black/10 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-branco.png"
            alt="LyneImob"
            width={120}
            height={30}
            className="h-7 w-auto"
            priority
          />
        </Link>

        {/* Navegacao desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {linksNavegacao.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTAs desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-white/90 hover:bg-white/10 hover:text-white"
            >
              Entrar
            </Button>
          </Link>
          <Link href="/cadastro">
            <Button className="bg-white font-semibold text-grad-mid hover:bg-white/90">
              Comece grátis
            </Button>
          </Link>
        </div>

        {/* Menu mobile */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10 md:hidden"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        >
          {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu mobile expandido */}
      {menuAberto && (
        <div className="border-t border-white/10 bg-grad-end/98 backdrop-blur-md md:hidden">
          <div className="space-y-1 px-4 py-4">
            {linksNavegacao.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuAberto(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              <Link href="/login" onClick={() => setMenuAberto(false)}>
                <Button
                  variant="ghost"
                  className="w-full text-white/90 hover:bg-white/10 hover:text-white"
                >
                  Entrar
                </Button>
              </Link>
              <Link href="/cadastro" onClick={() => setMenuAberto(false)}>
                <Button className="w-full bg-white font-semibold text-grad-mid hover:bg-white/90">
                  Comece grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
