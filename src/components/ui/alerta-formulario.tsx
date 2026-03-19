import { AlertCircle, CheckCircle2 } from "lucide-react"

interface AlertaFormularioProps {
  tipo: "erro" | "sucesso"
  mensagem: string
  children?: React.ReactNode
}

const estilos = {
  erro: { classes: "bg-destructive/10 text-destructive", Icone: AlertCircle },
  sucesso: { classes: "bg-success/10 text-success", Icone: CheckCircle2 },
}

export function AlertaFormulario({ tipo, mensagem, children }: AlertaFormularioProps) {
  const { classes, Icone } = estilos[tipo]

  return (
    <div className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${classes}`}>
      <Icone className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <span>{mensagem}</span>
        {children}
      </div>
    </div>
  )
}
