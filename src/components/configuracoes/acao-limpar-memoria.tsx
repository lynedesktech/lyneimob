"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { limparMemoriasOrganizacao } from "@/actions/whatsapp"

export function AcaoLimparMemoria() {
  const [limpando, setLimpando] = useState(false)

  async function handleLimpar() {
    setLimpando(true)
    const resultado = await limparMemoriasOrganizacao()
    setLimpando(false)

    if (resultado.erro) toast.error(resultado.erro)
    else toast.success(resultado.sucesso ?? "Memória limpa!")
  }

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Limpar memória de todas as conversas</h2>
        <p className="text-sm text-muted-foreground">
          O agente guarda as últimas 20 mensagens de cada conversa por 24 horas para manter o contexto dos atendimentos.
          Use esta ação para resetar o histórico imediatamente — útil em testes ou quando quiser que o agente comece do zero.
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={limpando}
        onClick={handleLimpar}
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        {limpando ? "Limpando..." : "Limpar memória de todas as conversas"}
      </Button>
    </div>
  )
}
