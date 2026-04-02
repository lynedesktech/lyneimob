"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MoreHorizontal } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatarData } from "@/lib/formatadores"
import { alterarCargoAdmin, alternarStatusAdmin, removerUsuarioAdmin } from "@/actions/usuarios-plataforma"

const BADGES_CARGO: Record<string, { label: string; variant: "default" | "secondary" | "success" }> = {
  admin: { label: "Admin", variant: "default" },
  gerente: { label: "Gerente", variant: "secondary" },
  corretor: { label: "Corretor", variant: "secondary" },
}

type UsuarioOrg = {
  id: string
  nome: string
  email: string
  cargo: string
  ativo: boolean
  created_at: string
}

interface TabelaUsuariosOrgProps {
  usuarios: UsuarioOrg[]
  ehSuperAdmin: boolean
}

export function TabelaUsuariosOrg({ usuarios, ehSuperAdmin }: TabelaUsuariosOrgProps) {
  const [usuarioAlterarCargo, setUsuarioAlterarCargo] = useState<UsuarioOrg | null>(null)
  const [usuarioRemover, setUsuarioRemover] = useState<UsuarioOrg | null>(null)

  async function handleAlternarStatus(usuario: UsuarioOrg) {
    const resultado = await alternarStatusAdmin(usuario.id)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Desde</TableHead>
              {ehSuperAdmin && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => {
              const badgeCargo = BADGES_CARGO[u.cargo] ?? { label: u.cargo, variant: "secondary" as const }

              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={badgeCargo.variant}>{badgeCargo.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.ativo ? "success" : "destructive"}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatarData(u.created_at)}
                  </TableCell>
                  {ehSuperAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 w-7 p-0" })}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setUsuarioAlterarCargo(u)}>
                            Alterar cargo
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAlternarStatus(u)}>
                            {u.ativo ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setUsuarioRemover(u)}
                          >
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={ehSuperAdmin ? 6 : 5}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog: Alterar cargo */}
      {usuarioAlterarCargo && (
        <DialogAlterarCargoAdmin
          usuario={usuarioAlterarCargo}
          aberto={!!usuarioAlterarCargo}
          onFechar={() => setUsuarioAlterarCargo(null)}
        />
      )}

      {/* Dialog: Remover */}
      {usuarioRemover && (
        <DialogRemoverAdmin
          usuario={usuarioRemover}
          aberto={!!usuarioRemover}
          onFechar={() => setUsuarioRemover(null)}
        />
      )}
    </>
  )
}

// ============================================================
// Dialog: Alterar cargo (admin)
// ============================================================

function DialogAlterarCargoAdmin({
  usuario,
  aberto,
  onFechar,
}: {
  usuario: UsuarioOrg
  aberto: boolean
  onFechar: () => void
}) {
  const [novoCargo, setNovoCargo] = useState(usuario.cargo)
  const [alterando, setAlterando] = useState(false)

  async function handleAlterar() {
    if (novoCargo === usuario.cargo) {
      onFechar()
      return
    }
    setAlterando(true)
    const resultado = await alterarCargoAdmin(usuario.id, novoCargo)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
    setAlterando(false)
    onFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) onFechar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar cargo</DialogTitle>
          <DialogDescription>
            Alterar o cargo de {usuario.nome}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={novoCargo} onValueChange={(val) => val && setNovoCargo(val)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corretor">Corretor</SelectItem>
              <SelectItem value="gerente">Gerente</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
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
// Dialog: Remover usuario (admin)
// ============================================================

function DialogRemoverAdmin({
  usuario,
  aberto,
  onFechar,
}: {
  usuario: UsuarioOrg
  aberto: boolean
  onFechar: () => void
}) {
  const [removendo, setRemovendo] = useState(false)

  async function handleRemover() {
    setRemovendo(true)
    const resultado = await removerUsuarioAdmin(usuario.id)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
    }
    setRemovendo(false)
    onFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) onFechar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover usuário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover {usuario.nome}?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
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
