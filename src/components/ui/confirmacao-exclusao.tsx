"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ConfirmacaoExclusaoProps {
  titulo: string
  descricao: string
  onConfirmar: () => Promise<{ erro?: string }>
  textoConfirmar?: string
  textoCancelar?: string
  textoExcluindo?: string
  tamanho?: "default" | "sm"
  trigger?: React.ReactElement
}

export function ConfirmacaoExclusao({
  titulo,
  descricao,
  onConfirmar,
  textoConfirmar = "Excluir",
  textoCancelar = "Cancelar",
  textoExcluindo = "Excluindo...",
  tamanho = "default",
  trigger,
}: ConfirmacaoExclusaoProps) {
  const [aberto, setAberto] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function handleConfirmar() {
    setExcluindo(true)
    const resultado = await onConfirmar()
    if (resultado?.erro) {
      toast.error(resultado.erro)
      setExcluindo(false)
      setAberto(false)
    }
  }

  return (
    <AlertDialog open={aberto} onOpenChange={setAberto}>
      <AlertDialogTrigger
        render={
          trigger || (
            <Button variant="destructive" size={tamanho}>
              <Trash2 className="mr-2 h-4 w-4" />
              {textoConfirmar}
            </Button>
          )
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{textoCancelar}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirmar}
            disabled={excluindo}
          >
            {excluindo ? textoExcluindo : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
