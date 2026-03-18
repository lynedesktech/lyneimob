import Link from "next/link"
import {
  Building2,
  Home,
  LandPlot,
  Store,
  Warehouse,
  Castle,
  DoorOpen,
  Trees,
  Fence,
  ShoppingBag,
} from "lucide-react"

type Props = {
  slug: string
}

const tiposComIcone = [
  { tipo: "apartamento", label: "Apartamento", icone: Building2 },
  { tipo: "casa", label: "Casa", icone: Home },
  { tipo: "terreno", label: "Terreno", icone: LandPlot },
  { tipo: "sala_comercial", label: "Sala Comercial", icone: Store },
  { tipo: "cobertura", label: "Cobertura", icone: Castle },
  { tipo: "kitnet", label: "Kitnet", icone: DoorOpen },
  { tipo: "galpao", label: "Galpão", icone: Warehouse },
  { tipo: "fazenda", label: "Fazenda", icone: Trees },
  { tipo: "sitio", label: "Sítio", icone: Fence },
  { tipo: "loja", label: "Loja", icone: ShoppingBag },
]

export function SecaoBuscarPorTipo({ slug }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Buscar por tipo de imóvel
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Encontre o imóvel ideal pelo tipo que você procura
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {tiposComIcone.map(({ tipo, label, icone: Icone }) => (
          <Link
            key={tipo}
            href={`/${slug}/imoveis?tipo=${tipo}`}
            className="group flex flex-col items-center gap-3 rounded-xl border bg-background p-5 transition-all hover:border-[var(--site-primaria)] hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--site-primaria)]/10 transition-colors group-hover:bg-[var(--site-primaria)]/20">
              <Icone className="h-6 w-6 text-[var(--site-primaria)]" />
            </div>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
