"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatarData } from "@/lib/formatadores"
import { atualizarPerfilPlataforma, type UsuarioPlataforma } from "@/actions/usuarios-plataforma"
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

interface TabelaUsuariosPlataformaProps {
  usuarios: UsuarioPlataforma[]
  podeMudarPerfil: boolean
}

export function TabelaUsuariosPlataforma({ usuarios, podeMudarPerfil }: TabelaUsuariosPlataformaProps) {
  const [pendente, iniciarTransicao] = useTransition()
  const [editandoId, setEditandoId] = useState<string | null>(null)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organização</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Perfil Plataforma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
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
                  <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell className="text-sm">
                    {u.organizacao_nome ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{LABELS_CARGO[u.cargo] ?? u.cargo}</span>
                  </TableCell>
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
                      <button
                        type="button"
                        onClick={() => podeMudarPerfil && setEditandoId(u.id)}
                        className={podeMudarPerfil ? "cursor-pointer" : ""}
                      >
                        {badgePerfil ? (
                          <Badge variant={badgePerfil.variant}>{badgePerfil.label}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.ativo ? "success" : "destructive"}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatarData(u.created_at)}
                  </TableCell>
                </TableRow>
              )
            })}
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
