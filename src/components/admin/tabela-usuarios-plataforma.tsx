"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Columns3 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatarData } from "@/lib/formatadores"
import {
  atualizarPerfilPlataforma,
  alterarCargoAdmin,
  alternarStatusAdmin,
  removerUsuarioAdmin,
  moverOrganizacaoAdmin,
  type UsuarioPlataforma,
} from "@/actions/usuarios-plataforma"
import type { PerfilPlataforma } from "@/lib/permissoes"

const LABELS_CARGO: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  corretor: "Corretor",
}

const LABELS_PERFIL: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  super_admin: { label: "Super Admin", variant: "default" },
  desenvolvedor: { label: "Desenvolvedor", variant: "success" },
  investidor: { label: "Investidor", variant: "warning" },
}

type ColunasVisiveis = {
  email: boolean
  organizacao: boolean
  cargo: boolean
  perfil: boolean
  status: boolean
  criadoEm: boolean
}

const colunasPadrao: ColunasVisiveis = {
  email: true,
  organizacao: true,
  cargo: true,
  perfil: true,
  status: true,
  criadoEm: true,
}

interface TabelaUsuariosPlataformaProps {
  usuarios: UsuarioPlataforma[]
  total?: number
  podeMudarPerfil: boolean
  organizacoes?: { id: string; nome: string }[]
  filtros?: React.ReactNode
  paginacao?: React.ReactNode
}

export function TabelaUsuariosPlataforma({
  usuarios,
  total = 0,
  podeMudarPerfil,
  organizacoes = [],
  filtros,
  paginacao,
}: TabelaUsuariosPlataformaProps) {
  const router = useRouter()
  const [colunas, setColunas] = useState<ColunasVisiveis>(colunasPadrao)
  const [pendente, iniciarTransicao] = useTransition()
  const [editandoId, setEditandoId] = useState<string | null>(null)

  // Dialogs state
  const [dialogCargo, setDialogCargo] = useState<UsuarioPlataforma | null>(null)
  const [dialogOrg, setDialogOrg] = useState<UsuarioPlataforma | null>(null)
  const [dialogRemover, setDialogRemover] = useState<UsuarioPlataforma | null>(null)

  function toggleColuna(col: keyof ColunasVisiveis) {
    setColunas((prev) => ({ ...prev, [col]: !prev[col] }))
  }

  function aoMudarPerfil(usuarioId: string, valor: string) {
    const perfil = valor === "nenhum" ? null : valor as PerfilPlataforma
    iniciarTransicao(async () => {
      const resultado = await atualizarPerfilPlataforma(usuarioId, perfil)
      if (resultado.erro) {
        toast.error(resultado.erro)
      } else {
        toast.success(resultado.sucesso)
      }
      setEditandoId(null)
    })
  }

  function aoAlternarStatus(usuario: UsuarioPlataforma) {
    iniciarTransicao(async () => {
      const resultado = await alternarStatusAdmin(usuario.id)
      if (resultado.erro) {
        toast.error(resultado.erro)
      } else {
        toast.success(resultado.sucesso)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {filtros ? (
          <div className="flex-1">{filtros}</div>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "usuário encontrado" : "usuários encontrados"}
          </p>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-4 w-4" />
                Colunas
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Visibilidade</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={colunas.email}
              onCheckedChange={() => toggleColuna("email")}
            >
              Email
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.organizacao}
              onCheckedChange={() => toggleColuna("organizacao")}
            >
              Organização
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.cargo}
              onCheckedChange={() => toggleColuna("cargo")}
            >
              Cargo
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.perfil}
              onCheckedChange={() => toggleColuna("perfil")}
            >
              Perfil Plataforma
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.status}
              onCheckedChange={() => toggleColuna("status")}
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.criadoEm}
              onCheckedChange={() => toggleColuna("criadoEm")}
            >
              Criado em
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {colunas.email && <TableHead>Email</TableHead>}
              {colunas.organizacao && <TableHead>Organização</TableHead>}
              {colunas.cargo && <TableHead>Cargo</TableHead>}
              {colunas.perfil && <TableHead>Perfil Plataforma</TableHead>}
              {colunas.status && <TableHead>Status</TableHead>}
              {colunas.criadoEm && <TableHead>Criado em</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => {
              const badgePerfil = u.perfil_plataforma
                ? LABELS_PERFIL[u.perfil_plataforma]
                : null

              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  {colunas.email && (
                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  )}
                  {colunas.organizacao && (
                    <TableCell className="text-sm">
                      {u.organizacao_nome ? (
                        <Link
                          href={`/admin/organizacoes/${u.organizacao_id}`}
                          className="hover:underline text-primary"
                        >
                          {u.organizacao_nome}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  {colunas.cargo && (
                    <TableCell>
                      <span className="text-sm">{LABELS_CARGO[u.cargo] ?? u.cargo}</span>
                    </TableCell>
                  )}
                  {colunas.perfil && (
                    <TableCell>
                      {podeMudarPerfil && editandoId === u.id ? (
                        <Select
                          defaultValue={u.perfil_plataforma ?? "nenhum"}
                          onValueChange={(valor) => valor && aoMudarPerfil(u.id, valor)}
                          disabled={pendente}
                        >
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nenhum">Nenhum</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                            <SelectItem value="investidor">Investidor</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span>
                          {badgePerfil ? (
                            <Badge variant={badgePerfil.variant}>{badgePerfil.label}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                  )}
                  {colunas.status && (
                    <TableCell>
                      <Badge variant={u.ativo ? "success" : "destructive"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  )}
                  {colunas.criadoEm && (
                    <TableCell className="text-muted-foreground text-sm">
                      {formatarData(u.created_at)}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          {podeMudarPerfil && (
                            <DropdownMenuItem onSelect={() => setEditandoId(u.id)}>
                              Alterar perfil plataforma
                            </DropdownMenuItem>
                          )}
                          {podeMudarPerfil && (
                            <DropdownMenuItem onSelect={() => setDialogCargo(u)}>
                              Alterar cargo
                            </DropdownMenuItem>
                          )}
                          {podeMudarPerfil && (
                            <DropdownMenuItem onSelect={() => setDialogOrg(u)}>
                              Mover organização
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {podeMudarPerfil && (
                            <DropdownMenuItem onSelect={() => aoAlternarStatus(u)}>
                              {u.ativo ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          )}
                          {u.organizacao_nome && (
                            <DropdownMenuItem
                              render={<Link href={`/admin/organizacoes/${u.organizacao_id ?? ""}`} />}
                            >
                              Ver organização
                            </DropdownMenuItem>
                          )}
                          {podeMudarPerfil && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() => setDialogRemover(u)}
                              >
                                Remover
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtros && paginacao && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "usuário encontrado" : "usuários encontrados"}
          </p>
          {paginacao}
        </div>
      )}

      {/* Dialog: Alterar cargo */}
      {dialogCargo && (
        <DialogAlterarCargoAdmin
          usuario={dialogCargo}
          aberto={!!dialogCargo}
          onFechar={() => setDialogCargo(null)}
        />
      )}

      {/* Dialog: Mover organizacao */}
      {dialogOrg && (
        <DialogMoverOrgAdmin
          usuario={dialogOrg}
          organizacoes={organizacoes}
          aberto={!!dialogOrg}
          onFechar={() => setDialogOrg(null)}
        />
      )}

      {/* Dialog: Remover usuario */}
      {dialogRemover && (
        <DialogRemoverAdmin
          usuario={dialogRemover}
          aberto={!!dialogRemover}
          onFechar={() => setDialogRemover(null)}
        />
      )}
    </div>
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
  usuario: UsuarioPlataforma
  aberto: boolean
  onFechar: () => void
}) {
  const router = useRouter()
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
      router.refresh()
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
          <Label className="mb-2 block">Cargo</Label>
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
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={handleAlterar} disabled={alterando}>
            {alterando ? "Alterando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Dialog: Mover organizacao (admin)
// ============================================================

function DialogMoverOrgAdmin({
  usuario,
  organizacoes,
  aberto,
  onFechar,
}: {
  usuario: UsuarioPlataforma
  organizacoes: { id: string; nome: string }[]
  aberto: boolean
  onFechar: () => void
}) {
  const router = useRouter()
  const [novaOrgId, setNovaOrgId] = useState(usuario.organizacao_id ?? "")
  const [novoCargo, setNovoCargo] = useState(usuario.cargo)
  const [movendo, setMovendo] = useState(false)

  async function handleMover() {
    if (!novaOrgId) {
      toast.error("Selecione uma organização.")
      return
    }
    setMovendo(true)
    const resultado = await moverOrganizacaoAdmin(usuario.id, novaOrgId, novoCargo)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      router.refresh()
    }
    setMovendo(false)
    onFechar()
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) onFechar() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover organização</DialogTitle>
          <DialogDescription>
            Mover {usuario.nome} para outra organização.
            {usuario.organizacao_nome && (
              <> Atualmente em: <strong>{usuario.organizacao_nome}</strong></>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nova organização</Label>
            <Select value={novaOrgId} onValueChange={(val) => val && setNovaOrgId(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a organização" />
              </SelectTrigger>
              <SelectContent>
                {organizacoes.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cargo na nova organização</Label>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={handleMover} disabled={movendo}>
            {movendo ? "Movendo..." : "Mover"}
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
  usuario: UsuarioPlataforma
  aberto: boolean
  onFechar: () => void
}) {
  const router = useRouter()
  const [removendo, setRemovendo] = useState(false)

  async function handleRemover() {
    setRemovendo(true)
    const resultado = await removerUsuarioAdmin(usuario.id)
    if (resultado.erro) {
      toast.error(resultado.erro)
    } else {
      toast.success(resultado.sucesso)
      router.refresh()
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
            Tem certeza que deseja remover <strong>{usuario.nome}</strong> ({usuario.email})?
            Esta ação não pode ser desfeita — a conta será excluída permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button variant="destructive" onClick={handleRemover} disabled={removendo}>
            {removendo ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
