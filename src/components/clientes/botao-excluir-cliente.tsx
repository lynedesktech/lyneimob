"use client"

import { useState } from "react"
import { excluirCliente } from "@/actions/clientes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

export function BotaoExcluirCliente({ clienteId }: { clienteId: string }) {
  const [excluindo, setExcluindo] = useState(false)

  async function handleExcluir() {
    setExcluindo(true)
    const resultado = await excluirCliente(clienteId)
    if (resultado?.erro) {
      toast.error(resultado.erro)
      setExcluindo(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir cliente</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este cliente? Todos os interesses,
            interações e dados serão removidos permanentemente. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button
            variant="destructive"
            onClick={handleExcluir}
            disabled={excluindo}
          >
            {excluindo ? "Excluindo..." : "Sim, excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
