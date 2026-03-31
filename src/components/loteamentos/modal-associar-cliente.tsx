"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { criarClienteBrowser } from "@/lib/supabase/client"
import { alterarStatusLote } from "@/actions/loteamentos"
import { User, Search } from "lucide-react"

type ClienteBase = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
}

type ModalAssociarClienteProps = {
  aberto: boolean
  onFechar: () => void
  loteId: string
  statusDestino: "reservado" | "vendido"
}

export function ModalAssociarCliente({
  aberto,
  onFechar,
  loteId,
  statusDestino,
}: ModalAssociarClienteProps) {
  const [clientes, setClientes] = useState<ClienteBase[]>([])
  const [busca, setBusca] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteBase | null>(null)
  const [modoOutro, setModoOutro] = useState(false)
  const [nomeManual, setNomeManual] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const labelStatus = statusDestino === "reservado" ? "Reservado" : "Vendido"

  // Buscar clientes da organização
  useEffect(() => {
    if (!aberto) return

    async function carregarClientes() {
      setCarregando(true)
      const supabase = criarClienteBrowser()
      const { data } = await supabase
        .from("clientes")
        .select("id, nome, email, telefone")
        .order("nome")
        .limit(500)

      setClientes(data ?? [])
      setCarregando(false)
    }

    carregarClientes()
  }, [aberto])

  // Resetar estado ao fechar
  useEffect(() => {
    if (!aberto) {
      setBusca("")
      setClienteSelecionado(null)
      setModoOutro(false)
      setNomeManual("")
    }
  }, [aberto])

  // Filtrar clientes pela busca
  const clientesFiltrados = useMemo(() => {
    if (!busca) return clientes
    const termo = busca.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.email && c.email.toLowerCase().includes(termo)) ||
        (c.telefone && c.telefone.includes(termo))
    )
  }, [clientes, busca])

  async function handleConfirmar() {
    if (!clienteSelecionado && !modoOutro) {
      toast.error("Selecione um cliente ou use a opção 'Outro'")
      return
    }
    if (modoOutro && !nomeManual.trim()) {
      toast.error("Informe o nome do comprador")
      return
    }

    setSalvando(true)

    const opcoes = clienteSelecionado
      ? { cliente_id: clienteSelecionado.id }
      : { comprador: nomeManual.trim() }

    const resultado = await alterarStatusLote(loteId, statusDestino, opcoes)

    setSalvando(false)

    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      onFechar()
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como {labelStatus}</DialogTitle>
          <DialogDescription>
            Associe um cliente a este lote. Busque na base ou informe manualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!modoOutro ? (
            <>
              {/* Busca de cliente existente */}
              <div className="rounded-md border">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar cliente pelo nome, email ou telefone..."
                    value={busca}
                    onValueChange={setBusca}
                  />
                  <CommandList className="max-h-[200px]">
                    {carregando ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Carregando clientes...
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clientesFiltrados.map((cliente) => (
                            <CommandItem
                              key={cliente.id}
                              value={cliente.id}
                              data-checked={clienteSelecionado?.id === cliente.id}
                              onSelect={() => setClienteSelecionado(cliente)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{cliente.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                  {[cliente.email, cliente.telefone]
                                    .filter(Boolean)
                                    .join(" • ") || "Sem contato"}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </div>

              {/* Cliente selecionado */}
              {clienteSelecionado && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{clienteSelecionado.nome}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 px-2 text-xs"
                    onClick={() => setClienteSelecionado(null)}
                  >
                    Remover
                  </Button>
                </div>
              )}

              {/* Opção "Outro" */}
              <button
                type="button"
                className="w-full text-left text-sm text-primary hover:underline"
                onClick={() => {
                  setModoOutro(true)
                  setClienteSelecionado(null)
                }}
              >
                Outro — informar nome manualmente
              </button>
            </>
          ) : (
            <>
              {/* Modo texto livre */}
              <div className="space-y-2">
                <Label htmlFor="nome-comprador">Nome do comprador</Label>
                <Input
                  id="nome-comprador"
                  placeholder="Digite o nome do comprador..."
                  value={nomeManual}
                  onChange={(e) => setNomeManual(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  setModoOutro(false)
                  setNomeManual("")
                }}
              >
                ← Voltar para busca de clientes
              </button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={salvando}>
            {salvando ? "Salvando..." : `Confirmar como ${labelStatus}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
