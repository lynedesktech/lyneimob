import Image from "next/image"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadge, configStatusLoteamento } from "@/components/ui/status-badge"
import { MapPin, Layers } from "lucide-react"
import { formatarPreco } from "@/lib/formatadores"
import type { Loteamento, LoteamentoFoto } from "@/types/database"

type LoteamentoComCapa = Loteamento & {
  loteamento_fotos: Pick<LoteamentoFoto, "url" | "eh_capa">[]
}

export function CardLoteamento({ loteamento }: { loteamento: LoteamentoComCapa }) {
  const fotoCapa = loteamento.loteamento_fotos.find((f) => f.eh_capa)
  const primeiraFoto = loteamento.loteamento_fotos[0]
  const fotoUrl = fotoCapa?.url ?? primeiraFoto?.url

  return (
    <Link href={`/loteamentos/${loteamento.id}`}>
      <Card className="overflow-hidden pt-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full bg-muted">
          {fotoUrl ? (
            <Image
              src={fotoUrl}
              alt={loteamento.nome}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <MapPin className="h-8 w-8" />
            </div>
          )}
          <div className="absolute right-2 top-2">
            <StatusBadge status={loteamento.status} config={configStatusLoteamento} />
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-1 text-base">
            {loteamento.nome}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
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
              {loteamento.total_lotes} lotes · {loteamento.lotes_disponiveis} disponíveis
            </span>
          </div>

          {loteamento.valor_total > 0 && (
            <p className="text-lg font-bold text-primary">
              {formatarPreco(loteamento.valor_total)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
