import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioNegocio } from "@/components/negocios/formulario-negocio"
import type { NegocioComRelacoes } from "@/types/database"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarNegocioPage({ params }: Props) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: negocio, error } = await supabase
    .from("negocios")
    .select(
      "*, clientes(id, nome, telefone, email), imoveis(id, titulo, codigo, tipo), usuarios(id, nome), pipeline_etapas(*)"
    )
    .eq("id", id)
    .single()

  if (error || !negocio) redirect("/negocios")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href={`/negocios/${id}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Negócio</h1>
          <p className="text-sm text-muted-foreground">
            Atualize as informações do negócio
          </p>
        </div>
      </div>

      <FormularioNegocio negocio={negocio as unknown as NegocioComRelacoes} />
    </div>
  )
}
