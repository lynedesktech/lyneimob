import { FormularioNegocio } from "@/components/negocios/formulario-negocio"

export default function NovoNegocioPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Negócio</h1>
        <p className="text-sm text-muted-foreground">
          Crie um novo negócio e acompanhe no pipeline
        </p>
      </div>

      <FormularioNegocio />
    </div>
  )
}
