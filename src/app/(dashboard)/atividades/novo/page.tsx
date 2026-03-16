import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormularioAtividade } from "@/components/atividades/formulario-atividade"

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function NovaAtividadePage({ searchParams }: Props) {
  const params = await searchParams

  const valoresIniciais = {
    titulo: params.titulo || undefined,
    tipo: params.tipo || undefined,
    negocio_id: params.negocio_id || undefined,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/atividades" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Atividade</h1>
          <p className="text-sm text-muted-foreground">
            Agende uma visita, ligação, follow-up ou outro compromisso
          </p>
        </div>
      </div>

      <FormularioAtividade valoresIniciais={valoresIniciais} />
    </div>
  )
}
