"use client"

import { useState } from "react"
import { BrainCircuit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { limparMemoriasOrganizacao } from "@/actions/whatsapp"

export function CardLimparMemoria() {
  const [limpando, setLimpando] = useState(false)

  async function handleLimpar() {
    setLimpando(true)
    const resultado = await limparMemoriasOrganizacao()
    setLimpando(false)

    if (resultado.erro) toast.error(resultado.erro)
    else toast.success(resultado.sucesso ?? "Memória limpa!")
  }

  return (
    <Card className="h-full">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="font-medium leading-tight">Memória do Agente</h3>
            <p className="text-sm text-muted-foreground">
              O agente guarda as últimas 20 mensagens de cada conversa por 24h.
              Limpe para reiniciar o contexto em testes.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={limpando}
            onClick={handleLimpar}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {limpando ? "Limpando..." : "Limpar memória de todas as conversas"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
