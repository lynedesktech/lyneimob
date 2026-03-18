"use client"

import { Play } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type PassoAjuda = {
  titulo: string
  descricao: string
}

type CardModuloAjudaProps = {
  titulo: string
  descricao: string
  icone: React.ReactNode
  passos: PassoAjuda[]
  videoUrl?: string | null
}

export function CardModuloAjuda({
  titulo,
  descricao,
  icone,
  passos,
  videoUrl,
}: CardModuloAjudaProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icone}
          </div>
          <div>
            <CardTitle className="text-lg">{titulo}</CardTitle>
            <CardDescription>{descricao}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Placeholder de vídeo */}
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`Vídeo: ${titulo}`}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Play className="h-6 w-6 ml-0.5" />
              </div>
              <span className="text-sm font-medium">Vídeo em breve</span>
            </div>
          )}
        </div>

        {/* Passo a passo */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Passo a passo</h3>
          <Accordion className="w-full">
            {passos.map((passo, indice) => (
              <AccordionItem key={indice}>
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {indice + 1}
                    </span>
                    {passo.titulo}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pl-8">
                  {passo.descricao}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  )
}
