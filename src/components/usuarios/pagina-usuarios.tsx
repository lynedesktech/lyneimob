"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { UserPlus, Mail, Shield, ShieldCheck, User, Copy, Check } from "lucide-react"
import { useListaUsuarios } from "@/hooks/use-lista-usuarios"
import { convidarUsuario, alterarCargo, alternarStatusUsuario, removerUsuario, revogarConvite } from "@/actions/usuarios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Usuario } from "@/types/database"

// Helper para extrair erro de resultado de server action
function temErro(resultado: Record<string, unknown>): string | null {
  if ("erro" in resultado && resultado.erro) return resultado.erro as string
  return null
}

// Helper para extrair sucesso de resultado de server action
function obterSucesso(resultado: Record<string, unknown>): string | null {
  if ("sucesso" in resultado && resultado.sucesso) return resultado.sucesso as string
  return null
}

const CARGOS_LABELS: Record<string, { label: string; cor: string }> = {
  admin: { label: "Admin", cor: "default" },
  gerente: { label: "Gerente", cor: "secondary" },
  corretor: { label: "Corretor", cor: "outline" },
}

interface PaginaUsuariosProps {
  ehAdmin: boolean
  usuarioLogadoId: string
}

export function PaginaUsuarios({ ehAdmin, usuarioLogadoId }: PaginaUsuariosProps) {
  const { usuarios, convites, carregando, recarregar } = useListaUsuarios()
  const queryClient = useQueryClient()

  if (carregando) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-muted-foreground">
            {usuarios.length} {usuarios.length === 1 ? "membro" : "membros"} na organizacao
          </p>
        </div>
        {ehAdmin && (
          <DialogConvidar onConvidar={() => {
            queryClient.invalidateQueries({ queryKey: ["usuarios-equipe"] })
          }} />
        )}
      </div>

      {/* Convites pendentes */}
      {ehAdmin && convites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Convites pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {convites.map((convite) => (
                <div key={convite.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{convite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Cargo: {CARGOS_LABELS[convite.cargo]?.label} · Expira em{" "}
                        {new Date(convite.expires_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BotaoCopiarLink token={convite.token} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const resultado = await revogarConvite(convite.id)
                        const erro = temErro(resultado)
                        if (erro) {
                          toast.error(erro)
                        } else {
                          toast.success("Convite revogado.")
                          queryClient.invalidateQueries({ queryKey: ["usuarios-equipe"] })
                        }
                      }}
                    >
                      Revogar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membros da equipe</CardTitle>
          <CardDescription>
            Gerencie os usuarios da sua organizacao
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                {ehAdmin && <TableHead className="text-right">Acoes</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <LinhaUsuario
                  key={u.id}
                  usuario={u}
                  ehAdmin={ehAdmin}
                  ehProprioUsuario={u.id === usuarioLogadoId}
                  onAtualizar={() => {
                    queryClient.invalidateQueries({ queryKey: ["usuarios-equipe"] })
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Linha de usuario na tabela
// ============================================================

function LinhaUsuario({
  usuario,
  ehAdmin,
  ehProprioUsuario,
  onAtualizar,
}: {
  usuario: Usuario
  ehAdmin: boolean
  ehProprioUsuario: boolean
  onAtualizar: () => void
}) {
  const [carregando, setCarregando] = useState(false)

  const IconeCargo = usuario.cargo === "admin" ? ShieldCheck : usuario.cargo === "gerente" ? Shield : User

  return (
    <TableRow className={!usuario.ativo ? "opacity-50" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          <IconeCargo className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{usuario.nome}</span>
          {ehProprioUsuario && (
            <Badge variant="outline" className="text-xs">
              Voce
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
      <TableCell>
        <Badge variant={CARGOS_LABELS[usuario.cargo]?.cor as "default" | "secondary" | "outline"}>
          {CARGOS_LABELS[usuario.cargo]?.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={usuario.ativo ? "default" : "destructive"}>
          {usuario.ativo ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      {ehAdmin && (
        <TableCell className="text-right">
          {!ehProprioUsuario && (
            <div className="flex items-center justify-end gap-2">
              <DialogAlterarCargo
                usuario={usuario}
                onAlterar={onAtualizar}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={carregando}
                onClick={async () => {
                  setCarregando(true)
                  const resultado = await alternarStatusUsuario(usuario.id)
                  const erro = temErro(resultado)
                  if (erro) {
                    toast.error(erro)
                  } else {
                    toast.success(obterSucesso(resultado) ?? "Status alterado.")
                    onAtualizar()
                  }
                  setCarregando(false)
                }}
              >
                {usuario.ativo ? "Desativar" : "Ativar"}
              </Button>
              <DialogRemoverUsuario
                usuario={usuario}
                onRemover={onAtualizar}
              />
            </div>
          )}
        </TableCell>
      )}
    </TableRow>
  )
}

// ============================================================
// Dialog: Convidar usuario
// ============================================================

function DialogConvidar({ onConvidar }: { onConvidar: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [tokenGerado, setTokenGerado] = useState<string | null>(null)

  async function handleConvidar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)

    const formData = new FormData(e.currentTarget)
    const resultado = await convidarUsuario(formData)
    const erro = temErro(resultado)

    if (erro) {
      toast.error(erro)
    } else {
      toast.success(obterSucesso(resultado) ?? "Convite criado!")
      setTokenGerado(("token" in resultado ? resultado.token : null) as string | null)
      onConvidar()
    }
    setEnviando(false)
  }

  function handleFechar() {
    setAberto(false)
    setTokenGerado(null)
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => {
      if (!open) handleFechar()
      else setAberto(true)
    }}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar
          </Button>
        }
      />
      <DialogContent>
        {tokenGerado ? (
          <>
            <DialogHeader>
              <DialogTitle>Convite criado!</DialogTitle>
              <DialogDescription>
                Compartilhe o link abaixo com a pessoa convidada. O convite expira em 7 dias.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border bg-muted p-3">
              <p className="text-sm break-all font-mono">
                {typeof window !== "undefined" ? `${window.location.origin}/convite/${tokenGerado}` : ""}
              </p>
            </div>
            <DialogFooter>
              <BotaoCopiarLink token={tokenGerado} label="Copiar link" />
              <Button onClick={handleFechar}>Fechar</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleConvidar}>
            <DialogHeader>
              <DialogTitle>Convidar membro</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo membro entrar na sua organizacao.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select name="cargo" defaultValue="corretor">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corretor">Corretor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleFechar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Criar convite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog: Alterar cargo
// ============================================================

function DialogAlterarCargo({
  usuario,
  onAlterar,
}: {
  usuario: Usuario
  onAlterar: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [novoCargo, setNovoCargo] = useState(usuario.cargo)
  const [alterando, setAlterando] = useState(false)

  async function handleAlterar() {
    if (novoCargo === usuario.cargo) {
      setAberto(false)
      return
    }
    setAlterando(true)
    const resultado = await alterarCargo(usuario.id, novoCargo)
    const erro = temErro(resultado)
    if (erro) {
      toast.error(erro)
    } else {
      toast.success(obterSucesso(resultado) ?? "Cargo alterado.")
      onAlterar()
    }
    setAlterando(false)
    setAberto(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Cargo
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar cargo</DialogTitle>
          <DialogDescription>
            Alterar o cargo de {usuario.nome}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={novoCargo} onValueChange={(val) => setNovoCargo(val as typeof novoCargo)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corretor">Corretor</SelectItem>
              <SelectItem value="gerente">Gerente</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAlterar} disabled={alterando}>
            {alterando ? "Alterando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog: Remover usuario
// ============================================================

function DialogRemoverUsuario({
  usuario,
  onRemover,
}: {
  usuario: Usuario
  onRemover: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [removendo, setRemovendo] = useState(false)

  async function handleRemover() {
    setRemovendo(true)
    const resultado = await removerUsuario(usuario.id)
    const erro = temErro(resultado)
    if (erro) {
      toast.error(erro)
    } else {
      toast.success(obterSucesso(resultado) ?? "Usuario removido.")
      onRemover()
    }
    setRemovendo(false)
    setAberto(false)
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            Remover
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover usuario</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover {usuario.nome} da organizacao?
            Esta acao nao pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleRemover} disabled={removendo}>
            {removendo ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Botao copiar link do convite
// ============================================================

function BotaoCopiarLink({ token, label = "Copiar" }: { token: string; label?: string }) {
  const [copiado, setCopiado] = useState(false)

  async function handleCopiar() {
    const link = `${window.location.origin}/convite/${token}`
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    toast.success("Link copiado!")
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopiar}>
      {copiado ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
      {copiado ? "Copiado" : label}
    </Button>
  )
}
