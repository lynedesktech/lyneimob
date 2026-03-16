"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ImovelFoto } from "@/types/database"

type Props = {
  fotos: ImovelFoto[]
  titulo: string
}

export function GaleriaImovel({ fotos, titulo }: Props) {
  // Ordenar: capa primeiro, depois por ordem
  const fotosOrdenadas = [...fotos].sort((a, b) => {
    if (a.eh_capa && !b.eh_capa) return -1
    if (!a.eh_capa && b.eh_capa) return 1
    return a.ordem - b.ordem
  })

  const [indiceAtual, setIndiceAtual] = useState(0)

  if (fotosOrdenadas.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
        Nenhuma foto disponível
      </div>
    )
  }

  const fotoAtual = fotosOrdenadas[indiceAtual]

  function anterior() {
    setIndiceAtual((i) =>
      i === 0 ? fotosOrdenadas.length - 1 : i - 1
    )
  }

  function proxima() {
    setIndiceAtual((i) =>
      i === fotosOrdenadas.length - 1 ? 0 : i + 1
    )
  }

  return (
    <div className="space-y-3">
      {/* Foto principal */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={fotoAtual.url}
          alt={`${titulo} — foto ${indiceAtual + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority={indiceAtual === 0}
        />

        {fotosOrdenadas.length > 1 && (
          <>
            <button
              onClick={anterior}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={proxima}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {indiceAtual + 1} / {fotosOrdenadas.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {fotosOrdenadas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotosOrdenadas.map((foto, indice) => (
            <button
              key={foto.id}
              onClick={() => setIndiceAtual(indice)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md transition-all ${
                indice === indiceAtual
                  ? "ring-2 ring-[var(--site-primaria)] ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={foto.url}
                alt={`Miniatura ${indice + 1}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
