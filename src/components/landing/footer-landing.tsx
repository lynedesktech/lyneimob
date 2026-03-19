import Link from "next/link"
import Image from "next/image"

export function FooterLanding() {
  const anoAtual = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo e copyright */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo-preto.png"
              alt="LyneImob"
              width={100}
              height={25}
              className="h-6 w-auto dark:hidden"
            />
            <Image
              src="/logo-branco.png"
              alt="LyneImob"
              width={100}
              height={25}
              className="hidden h-6 w-auto dark:block"
            />
            <span className="text-sm text-muted-foreground">
              &copy; {anoAtual} LyneImob. Todos os direitos reservados.
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/termos"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Termos de uso
            </Link>
            <Link
              href="/privacidade"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacidade
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
