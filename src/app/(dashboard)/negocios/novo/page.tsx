import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormularioNegocio } from "@/components/negocios/formulario-negocio"

export default function NovoNegocioPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/negocios" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Negócio</h1>
          <p className="text-sm text-muted-foreground">
            Crie um novo negócio e acompanhe no pipeline
          </p>
        </div>
      </div>

      <FormularioNegocio />
    </div>
  )
}
