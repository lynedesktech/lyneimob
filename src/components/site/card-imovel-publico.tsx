import Image from "next/image"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MapPin, BedDouble, Car, Maximize, Bath } from "lucide-react"
import { formatarPreco } from "@/lib/site/buscar-dados-site"
import { labelsTipoImovel } from "@/lib/constantes"
import type { Imovel, ImovelFoto } from "@/types/database"

type ImovelComCapa = Imovel & {
  imovel_fotos: Pick<ImovelFoto, "id" | "url" | "ordem" | "eh_capa">[]
}

type Props = {
  imovel: ImovelComCapa
  slug: string
}

export function CardImovelPublico({ imovel, slug }: Props) {
  const fotoCapa = imovel.imovel_fotos.find((f) => f.eh_capa)
  const primeiraFoto = imovel.imovel_fotos[0]
  const fotoUrl = fotoCapa?.url ?? primeiraFoto?.url

  const preco =
    imovel.finalidade === "aluguel"
      ? imovel.preco_aluguel
      : imovel.preco_venda

  return (
    <Link href={`/${slug}/imoveis/${imovel.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-video w-full bg-muted">
          {fotoUrl ? (
            <Image
              src={fotoUrl}
              alt={imovel.titulo}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Maximize className="h-8 w-8" />
            </div>
          )}
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-[var(--site-primaria)] px-3 py-1 text-xs font-medium text-white">
              {imovel.finalidade === "venda"
                ? "Venda"
                : imovel.finalidade === "aluguel"
                  ? "Aluguel"
                  : "Venda e Aluguel"}
            </span>
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-1 text-base">
            {imovel.titulo_ia || imovel.titulo}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {labelsTipoImovel[imovel.tipo] ?? imovel.tipo} • Cód. {imovel.codigo}
          </p>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-xl font-bold text-[var(--site-primaria)]">
            {formatarPreco(preco)}
            {imovel.finalidade !== "venda" && preco ? (
              <span className="text-xs font-normal text-muted-foreground">
                /mês
              </span>
            ) : null}
          </p>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">
              {imovel.bairro ? `${imovel.bairro}, ` : ""}
              {imovel.cidade} - {imovel.estado}
            </span>
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            {imovel.quartos > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" />
                {imovel.quartos} {imovel.quartos === 1 ? "quarto" : "quartos"}
              </span>
            )}
            {imovel.banheiros > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {imovel.banheiros}
              </span>
            )}
            {imovel.vagas_garagem > 0 && (
              <span className="flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                {imovel.vagas_garagem}
              </span>
            )}
            {imovel.area_total && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                {imovel.area_total}m²
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
