"use client"

import { useState } from "react"
import { toast } from "sonner"
import { processarLead, descartarLead } from "@/actions/leads-portais"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserPlus, XCircle } from "lucide-react"
import type { LeadPortalComRelacoes } from "@/types/database"

interface AcoesLeadProps {
  lead: LeadPortalComRelacoes
}

export function AcoesLead({ lead }: AcoesLeadProps) {
  if (lead.status === "processado" || lead.status === "descartado") {
    return null
  }

  return (
    <div className="flex gap-2">
      <BotaoProcessar leadId={lead.id} leadNome={lead.nome} />
      <BotaoDescartar leadId={lead.id} />
    </div>
  )
}

// ============================================================
// Botão Processar — cria cliente + negócio
// ============================================================

function BotaoProcessar({ leadId, leadNome }: { leadId: string; leadNome: string | null }) {
  const [aberto, setAberto] = useState(false)
  const [processando, setProcessando] = useState(false)

  async function handleProcessar() {
    setProcessando(true)
    const resultado = await processarLead(leadId)
    setProcessando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      setAberto(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="success" size="sm">
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Processar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Processar lead</DialogTitle>
          <DialogDescription>
            Isso vai criar automaticamente um <strong>cliente</strong> e um <strong>negócio</strong> no pipeline
            {leadNome ? ` para ${leadNome}` : ""}.
            {" "}Se o cliente já existir (mesmo email ou telefone), será vinculado ao existente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleProcessar}
            disabled={processando}
            variant="success"
          >
            {processando ? "Processando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Botão Descartar
// ============================================================

function BotaoDescartar({ leadId }: { leadId: string }) {
  const [descartando, setDescartando] = useState(false)

  async function handleDescartar() {
    setDescartando(true)
    const resultado = await descartarLead(leadId)
    setDescartando(false)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDescartar}
      disabled={descartando}
      className="text-muted-foreground"
    >
      <XCircle className="mr-1.5 h-3.5 w-3.5" />
      {descartando ? "..." : "Descartar"}
    </Button>
  )
}
