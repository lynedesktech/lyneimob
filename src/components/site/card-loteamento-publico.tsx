import Image from "next/image"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MapPin, Layers, LandPlot } from "lucide-react"
import { formatarPreco } from "@/lib/site/buscar-dados-site"
import { labelsStatusLoteamento } from "@/lib/constantes"
import type { Loteamento, LoteamentoFoto } from "@/types/database"

type LoteamentoComDados = Loteamento & {
  loteamento_fotos: Pick<LoteamentoFoto, "id" | "url" | "ordem" | "eh_capa">[]
  lotes: { valor: number; status: string }[]
}

type Props = {
  loteamento: LoteamentoComDados
  slug: string
}

export function CardLoteamentoPublico({ loteamento, slug }: Props) {
  const fotoCapa = loteamento.loteamento_fotos.find((f) => f.eh_capa)
  const primeiraFoto = loteamento.loteamento_fotos[0]
  const fotoUrl = fotoCapa?.url ?? primeiraFoto?.url

  // Calcular menor valor entre todos os lotes com valor > 0
  const lotesComValor = loteamento.lotes.filter((l) => l.valor > 0)
  const valorMinimo =
    lotesComValor.length > 0
      ? Math.min(...lotesComValor.map((l) => l.valor))
      : null

  return (
    <Link href={`/${slug}/loteamentos/${loteamento.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {fotoUrl ? (
            <Image
              src={fotoUrl}
              alt={loteamento.nome}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <LandPlot className="h-8 w-8" />
            </div>
          )}
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-[var(--site-primaria)] px-3 py-1 text-xs font-medium text-white">
              {labelsStatusLoteamento[loteamento.status]}
            </span>
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-1 text-base">
            {loteamento.nome}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          {valorMinimo ? (
            <div>
              <span className="text-xs font-medium text-muted-foreground">A partir de</span>
              <p className="text-xl font-bold text-[var(--site-primaria)]">
                {formatarPreco(valorMinimo)}
              </p>
            </div>
          ) : (
            <p className="text-xl font-bold text-[var(--site-primaria)]">
              Consulte
            </p>
          )}

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">
              {loteamento.bairro ? `${loteamento.bairro}, ` : ""}
              {loteamento.cidade} - {loteamento.estado}
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span>
              {loteamento.lotes_disponiveis}{" "}
              {loteamento.lotes_disponiveis === 1
                ? "lote disponível"
                : "lotes disponíveis"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
