import { AlertCircle, CheckCircle2 } from "lucide-react"

interface AlertaFormularioProps {
  tipo: "erro" | "sucesso"
  mensagem: string
  children?: React.ReactNode
}

export function AlertaFormulario({ tipo, mensagem, children }: AlertaFormularioProps) {
  const Icone = tipo === "erro" ? AlertCircle : CheckCircle2
  const cor = tipo === "erro" ? "destructive" : "success"

  return (
    <div
      className={`flex items-start gap-3 rounded-lg bg-${cor}/10 px-4 py-3 text-sm text-${cor}`}
    >
      <Icone className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <span>{mensagem}</span>
        {children}
      </div>
    </div>
  )
}
