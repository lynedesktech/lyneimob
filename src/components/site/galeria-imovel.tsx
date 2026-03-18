"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
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

  const [api, setApi] = useState<CarouselApi>()
  const [indiceAtual, setIndiceAtual] = useState(0)

  const onSelect = useCallback(() => {
    if (!api) return
    setIndiceAtual(api.selectedScrollSnap())
  }, [api])

  useEffect(() => {
    if (!api) return
    onSelect()
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api, onSelect])

  if (fotosOrdenadas.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
        Nenhuma foto disponível
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Foto principal — Carousel embla */}
      <div className="relative">
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {fotosOrdenadas.map((foto, indice) => (
              <CarouselItem key={foto.id} className="pl-0">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={foto.url}
                    alt={`${titulo} — foto ${indice + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority={indice === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {fotosOrdenadas.length > 1 && (
            <>
              <button
                onClick={() => api?.scrollPrev()}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => api?.scrollNext()}
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
        </Carousel>
      </div>

      {/* Miniaturas */}
      {fotosOrdenadas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotosOrdenadas.map((foto, indice) => (
            <button
              key={foto.id}
              onClick={() => api?.scrollTo(indice)}
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
