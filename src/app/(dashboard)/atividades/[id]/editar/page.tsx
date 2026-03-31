import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioAtividade } from "@/components/atividades/formulario-atividade"
import type { AtividadeComRelacoes } from "@/types/database"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarAtividadePage({ params }: Props) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: atividade, error } = await supabase
    .from("atividades")
    .select(
      "*, clientes(id, nome, telefone), imoveis(id, titulo, codigo_interno), negocios(id, titulo, status)"
    )
    .eq("id", id)
    .single()

  if (error || !atividade) redirect("/atividades")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href={`/atividades/${id}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Atividade</h1>
          <p className="text-sm text-muted-foreground">
            Atualize as informações da atividade
          </p>
        </div>
      </div>

      <FormularioAtividade atividade={atividade as unknown as AtividadeComRelacoes} />
    </div>
  )
}
