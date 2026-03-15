import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioCliente } from "@/components/clientes/formulario-cliente"

type Params = Promise<{ id: string }>

export default async function EditarClientePage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single()

  if (!cliente) {
    redirect("/clientes")
  }

  return <FormularioCliente cliente={cliente} />
}
