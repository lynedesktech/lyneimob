"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { criarClienteBrowser } from "@/lib/supabase/client"
import type { ClienteInteresse, Imovel } from "@/types/database"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, BedDouble, DollarSign, Search } from "lucide-react"
import { labelsTipoImovel } from "@/lib/constantes"
import { formatarPreco } from "@/lib/formatadores"

type MatchImoveisProps = {
  organizacaoId: string
  interesses: ClienteInteresse[]
}

export function MatchImoveis({ organizacaoId, interesses }: MatchImoveisProps) {
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscarMatch() {
      if (interesses.length === 0) {
        setImoveis([])
        setCarregando(false)
        return
      }

      const supabase = criarClienteBrowser()

      let query = supabase
        .from("imoveis")
        .select("*")
        .eq("organizacao_id", organizacaoId)
        .eq("status", "disponivel")
        .order("created_at", { ascending: false })
        .limit(20)

      // Aplicar filtros do primeiro interesse (mais relevante)
      const interesse = interesses[0]

      if (interesse.tipo_imovel) {
        query = query.eq("tipo", interesse.tipo_imovel)
      }
      if (interesse.finalidade && interesse.finalidade !== "venda_e_aluguel") {
        query = query.or(`finalidade.eq.${interesse.finalidade},finalidade.eq.venda_e_aluguel`)
      }
      if (interesse.cidade) {
        query = query.ilike("cidade", `%${interesse.cidade}%`)
      }
      if (interesse.preco_min) {
        query = query.or(`valor.gte.${interesse.preco_min},valor_aluguel.gte.${interesse.preco_min}`)
      }
      if (interesse.preco_max) {
        query = query.or(`valor.lte.${interesse.preco_max},valor_aluguel.lte.${interesse.preco_max}`)
      }
      if (interesse.quartos_min) {
        query = query.gte("quartos", interesse.quartos_min)
      }
      if (interesse.area_min) {
        query = query.gte("area_total", interesse.area_min)
      }

      const { data } = await query

      // Filtro client-side para bairros (array overlap)
      let resultado = (data as Imovel[]) ?? []
      if (interesse.bairros_interesse && interesse.bairros_interesse.length > 0) {
        const bairrosLower = interesse.bairros_interesse.map((b) => b.toLowerCase())
        resultado = resultado.filter((imovel) =>
          imovel.bairro && bairrosLower.some((b) => imovel.bairro!.toLowerCase().includes(b))
        )
      }

      setImoveis(resultado)
      setCarregando(false)
    }

    buscarMatch()
  }, [organizacaoId, interesses])

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Search className="mr-2 h-5 w-5 animate-spin" />
        Buscando imóveis compatíveis...
      </div>
    )
  }

  if (interesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Search className="mb-2 h-8 w-8" />
        <p>Cadastre um interesse primeiro</p>
        <p className="text-sm">O match automático usa os interesses do cliente para encontrar imóveis</p>
      </div>
    )
  }

  if (imoveis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Search className="mb-2 h-8 w-8" />
        <p>Nenhum imóvel compatível encontrado</p>
        <p className="text-sm">Tente ajustar os critérios de interesse do cliente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {imoveis.length} imóve{imoveis.length === 1 ? "l" : "is"} compatíve{imoveis.length === 1 ? "l" : "is"} encontrado{imoveis.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {imoveis.map((imovel) => (
          <Link key={imovel.id} href={`/imoveis/${imovel.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-sm">
                    {imovel.titulo}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {labelsTipoImovel[imovel.tipo] ?? imovel.tipo}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatarPreco(imovel.valor ?? imovel.valor_aluguel)}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {imovel.bairro ? `${imovel.bairro}, ` : ""}{imovel.cidade} - {imovel.estado}
                </div>
                {imovel.quartos > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BedDouble className="h-3 w-3" />
                    {imovel.quartos} quartos
                    {imovel.area_total ? ` • ${imovel.area_total}m²` : ""}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
