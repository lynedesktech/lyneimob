import Link from "next/link"
import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ImportadorLotes } from "@/components/loteamentos/importador-lotes"
import { ArrowLeft } from "lucide-react"

type Params = Promise<{ id: string }>

export default async function ImportarLotesPage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: loteamento } = await supabase
    .from("loteamentos")
    .select("id, nome")
    .eq("id", id)
    .single()

  if (!loteamento) {
    redirect("/loteamentos")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href={`/loteamentos/${id}`} />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar lotes</h1>
          <p className="text-sm text-muted-foreground">{loteamento.nome}</p>
        </div>
      </div>

      <ImportadorLotes loteamentoId={id} />
    </div>
  )
}
