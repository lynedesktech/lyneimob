import Image from "next/image"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { MapPin, BedDouble, Car, Maximize } from "lucide-react"
import type { Imovel, ImovelFoto } from "@/types/database"

type ImovelComCapa = Imovel & {
  imovel_fotos: Pick<ImovelFoto, "url" | "eh_capa">[]
}

function formatarPreco(valor: number | null): string {
  if (!valor) return "—"
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

const labelsTipo: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  terreno: "Terreno",
  sala_comercial: "Sala Comercial",
  galpao: "Galpão",
  cobertura: "Cobertura",
  kitnet: "Kitnet",
  fazenda: "Fazenda",
  sitio: "Sítio",
  loja: "Loja",
  outro: "Outro",
}

export function CardImovel({ imovel }: { imovel: ImovelComCapa }) {
  const fotoCapa = imovel.imovel_fotos.find((f) => f.eh_capa)
  const primeiraFoto = imovel.imovel_fotos[0]
  const fotoUrl = fotoCapa?.url ?? primeiraFoto?.url

  const preco =
    imovel.finalidade === "aluguel"
      ? imovel.preco_aluguel
      : imovel.preco_venda

  return (
    <Link href={`/imoveis/${imovel.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full bg-muted">
          {fotoUrl ? (
            <Image
              src={fotoUrl}
              alt={imovel.titulo}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Maximize className="h-8 w-8" />
            </div>
          )}
          <div className="absolute right-2 top-2">
            <StatusBadge status={imovel.status} />
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-base">
              {imovel.titulo}
            </CardTitle>
            <span className="shrink-0 text-xs text-muted-foreground">
              {imovel.codigo}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {labelsTipo[imovel.tipo] ?? imovel.tipo} •{" "}
            {imovel.finalidade === "venda"
              ? "Venda"
              : imovel.finalidade === "aluguel"
                ? "Aluguel"
                : "Venda e Aluguel"}
          </p>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-lg font-bold text-primary">
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

          <div className="flex gap-3 text-sm text-muted-foreground">
            {imovel.quartos > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" />
                {imovel.quartos}
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
