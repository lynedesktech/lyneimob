"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  verificarStatusInstancia,
  criarEConectarInstancia,
  desconectarInstancia,
} from "@/actions/instancia-whatsapp"
import type { StatusInstancia } from "@/types/whatsapp"
import { toast } from "sonner"

export function useInstanciaWhatsapp() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["instancia-whatsapp-status"],
    queryFn: async () => {
      const resultado = await verificarStatusInstancia()
      return resultado
    },
    refetchInterval: (query) => {
      // Polling a cada 5s quando aguardando QR code
      const status = query.state.data?.status
      return status === "connecting" ? 5000 : false
    },
  })

  const status: StatusInstancia = data?.status || "disconnected"
  const configurado = data?.configurado ?? false
  const qrCode = data?.qrCode || null
  const numero = data?.numero || null
  const perfilNome = data?.perfilNome || null
  const perfilFoto = data?.perfilFoto || null

  const { mutate: conectar, isPending: conectando } = useMutation({
    mutationFn: async () => {
      const resultado = await criarEConectarInstancia()
      if (resultado.erro) throw new Error(resultado.erro)
      return resultado
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instancia-whatsapp-status"] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const { mutate: desconectar, isPending: desconectando } = useMutation({
    mutationFn: async () => {
      const resultado = await desconectarInstancia()
      if (resultado.erro) throw new Error(resultado.erro)
      return resultado
    },
    onSuccess: () => {
      toast.success("WhatsApp desconectado")
      queryClient.invalidateQueries({ queryKey: ["instancia-whatsapp-status"] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return {
    status,
    configurado,
    qrCode,
    numero,
    perfilNome,
    perfilFoto,
    carregando: isLoading,
    conectar,
    conectando,
    desconectar,
    desconectando,
  }
}
