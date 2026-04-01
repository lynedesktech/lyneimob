import { Building2, MapPin, Handshake, Users, LandPlot } from "lucide-react"

type Props = {
  totalImoveis: number
  totalBairros: number
  totalLoteamentos?: number
}

export function SecaoEstatisticas({
  totalImoveis,
  totalBairros,
  totalLoteamentos,
}: Props) {
  const temLoteamentos = totalLoteamentos && totalLoteamentos > 0

  const estatisticas = [
    {
      icone: Building2,
      valor: totalImoveis,
      label: "Imóveis disponíveis",
    },
    temLoteamentos
      ? {
          icone: LandPlot,
          valor: totalLoteamentos,
          label: "Loteamentos",
        }
      : {
          icone: MapPin,
          valor: totalBairros,
          label: "Bairros atendidos",
        },
    {
      icone: Handshake,
      valor: 100,
      sufixo: "%",
      label: "Compromisso com você",
    },
    {
      icone: Users,
      valor: 24,
      sufixo: "h",
      label: "Atendimento ágil",
    },
  ]

  return (
    <section className="px-4 py-16" style={{ backgroundColor: "var(--site-primaria)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {estatisticas.map((item) => (
            <div key={item.label} className="text-center text-white">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <item.icone className="h-7 w-7" />
              </div>
              <p className="text-3xl font-bold">
                {item.valor}
                {item.sufixo && (
                  <span className="text-lg font-normal">{item.sufixo}</span>
                )}
              </p>
              <p className="mt-1 text-sm text-white/70">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
