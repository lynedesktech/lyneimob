import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioLoteamento } from "@/components/loteamentos/formulario-loteamento"

type Params = Promise<{ id: string }>

export default async function EditarLoteamentoPage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: loteamento } = await supabase
    .from("loteamentos")
    .select("*")
    .eq("id", id)
    .single()

  if (!loteamento) {
    redirect("/loteamentos")
  }

  return <FormularioLoteamento loteamento={loteamento} />
}
