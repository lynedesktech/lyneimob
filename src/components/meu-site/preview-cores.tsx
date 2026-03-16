"use client"

import type { CoresSite } from "@/types/configuracoes-site"

type Props = {
  cores: CoresSite
  nomeOrg: string
}

export function PreviewCores({ cores, nomeOrg }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border shadow-sm">
      {/* Header mockup */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2.5">
        <span
          className="text-sm font-bold"
          style={{ color: cores.primaria }}
        >
          {nomeOrg}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Início</span>
          <span className="text-xs text-muted-foreground">Imóveis</span>
          <span className="text-xs text-muted-foreground">Sobre</span>
          <span
            className="rounded px-2.5 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: cores.primaria }}
          >
            Contato
          </span>
        </div>
      </div>

      {/* Hero mockup */}
      <div
        className="px-4 py-8 text-center text-white"
        style={{ backgroundColor: cores.hero_fundo }}
      >
        <p className="text-lg font-bold">Encontre o imóvel ideal</p>
        <p className="mt-1 text-xs text-white/70">
          com a {nomeOrg}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <span className="rounded bg-white px-3 py-1 text-xs font-medium" style={{ color: cores.primaria }}>
            Ver imóveis
          </span>
          <span className="rounded border border-white/30 px-3 py-1 text-xs font-medium text-white">
            Fale conosco
          </span>
        </div>
      </div>

      {/* Content mockup */}
      <div className="bg-background px-4 py-4">
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 rounded border p-2">
              <div className="mb-2 h-12 rounded bg-muted" />
              <div className="h-2 w-3/4 rounded bg-muted" />
              <p
                className="mt-1.5 text-xs font-bold"
                style={{ color: cores.primaria }}
              >
                R$ 450.000
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer mockup */}
      <div
        className="px-4 py-3 text-center text-xs text-white/70"
        style={{ backgroundColor: cores.primaria }}
      >
        © 2026 {nomeOrg}
      </div>
    </div>
  )
}
