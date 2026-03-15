"use client"

import { useActionState } from "react"
import { criarInteracao } from "@/actions/clientes"
import type { EstadoFormulario } from "@/types/formulario"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { toast } from "sonner"

const opcoesTipo = [
  { value: "ligacao", label: "Ligação" },
  { value: "email", label: "Email" },
  { value: "visita", label: "Visita" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "reuniao", label: "Reunião" },
  { value: "outro", label: "Outro" },
]

type FormularioInteracaoProps = {
  clienteId: string
}

export function FormularioInteracao({ clienteId }: FormularioInteracaoProps) {
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(async (estado, formData) => {
    const resultado = await criarInteracao(estado, formData)
    if (resultado.sucesso) {
      toast.success(resultado.sucesso)
    } else if (resultado.erro) {
      toast.error(resultado.erro)
    }
    return resultado
  }, {})

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova interação
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar interação</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="cliente_id" value={clienteId} />

          {estado.erro && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {estado.erro}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select name="tipo" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {opcoesTipo.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">O que aconteceu?</Label>
            <Textarea
              id="descricao"
              name="descricao"
              placeholder="Descreva a interação..."
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
