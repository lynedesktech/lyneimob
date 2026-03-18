import Link from "next/link"
import Image from "next/image"
import type { OrganizacaoSite } from "@/lib/site/buscar-dados-site"

type Props = {
  organizacao: OrganizacaoSite
}

export function HeaderSite({ organizacao }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href={`/${organizacao.slug}`}
          className="flex items-center gap-2.5"
        >
          {organizacao.logo_url && (
            <Image
              src={organizacao.logo_url}
              alt={organizacao.nome}
              width={36}
              height={36}
              className="rounded"
            />
          )}
          <span className="text-lg font-bold text-[var(--site-primaria)]">
            {organizacao.nome}
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href={`/${organizacao.slug}`}
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--site-primaria)] sm:block"
          >
            Início
          </Link>
          <Link
            href={`/${organizacao.slug}/imoveis`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--site-primaria)]"
          >
            Imóveis
          </Link>
          <Link
            href={`/${organizacao.slug}/sobre`}
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--site-primaria)] sm:block"
          >
            Sobre
          </Link>
          <Link
            href={`/${organizacao.slug}/contato`}
            className="rounded-md bg-[var(--site-primaria)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--site-primaria)]/90"
          >
            Contato
          </Link>
        </nav>
      </div>
    </header>
  )
}
