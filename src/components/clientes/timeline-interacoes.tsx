"use client"

import { useState } from "react"
import { excluirInteracao } from "@/actions/clientes"
import type { ClienteInteracao } from "@/types/database"
import { Button } from "@/components/ui/button"
import { FormularioInteracao } from "./formulario-interacao"
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Users,
  MoreHorizontal,
  Trash2,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"

const iconesInteracao: Record<string, React.ReactNode> = {
  ligacao: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  visita: <MapPin className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  reuniao: <Users className="h-4 w-4" />,
  outro: <MoreHorizontal className="h-4 w-4" />,
}

const labelsInteracao: Record<string, string> = {
  ligacao: "Ligação",
  email: "Email",
  visita: "Visita",
  whatsapp: "WhatsApp",
  reuniao: "Reunião",
  outro: "Outro",
}

type TimelineInteracoesProps = {
  clienteId: string
  interacoes: (ClienteInteracao & { usuarios?: { nome: string } })[]
}

export function TimelineInteracoes({ clienteId, interacoes }: TimelineInteracoesProps) {
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  async function handleExcluir(interacaoId: string) {
    setExcluindoId(interacaoId)
    const resultado = await excluirInteracao(interacaoId, clienteId)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
    setExcluindoId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Histórico de interações</h3>
        <FormularioInteracao clienteId={clienteId} />
      </div>

      {interacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <MessageSquare className="mb-2 h-8 w-8" />
          <p>Nenhuma interação registrada</p>
          <p className="text-sm">Registre ligações, visitas e conversas</p>
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* Linha vertical da timeline */}
          <div className="absolute left-4 top-0 h-full w-px bg-border" />

          {interacoes.map((interacao) => (
            <div key={interacao.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Ícone na timeline */}
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                {iconesInteracao[interacao.tipo] ?? iconesInteracao.outro}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-medium">
                      {labelsInteracao[interacao.tipo] ?? interacao.tipo}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      por {interacao.usuarios?.nome ?? "Desconhecido"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(interacao.data).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleExcluir(interacao.id)}
                      disabled={excluindoId === interacao.id}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {interacao.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
