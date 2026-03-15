import { redirect } from "next/navigation"
import { criarClienteServer } from "@/lib/supabase/server"
import { FormularioImovel } from "@/components/imoveis/formulario-imovel"

type Params = Promise<{ id: string }>

export default async function EditarImovelPage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  const supabase = await criarClienteServer()

  const { data: imovel } = await supabase
    .from("imoveis")
    .select("*")
    .eq("id", id)
    .single()

  if (!imovel) {
    redirect("/imoveis")
  }

  return <FormularioImovel imovel={imovel} />
}
