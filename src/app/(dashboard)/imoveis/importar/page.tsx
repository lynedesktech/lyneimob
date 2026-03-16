import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImportadorImoveis } from "@/components/imoveis/importador-imoveis"

export default function ImportarImoveisPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/imoveis" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar Imóveis</h1>
          <p className="text-sm text-muted-foreground">
            Importe imóveis em massa a partir de um arquivo CSV ou Excel
          </p>
        </div>
      </div>

      <ImportadorImoveis />
    </div>
  )
}
