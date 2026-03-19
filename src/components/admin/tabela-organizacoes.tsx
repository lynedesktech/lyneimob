"use client"

import { useState } from "react"
import Link from "next/link"
import { Columns3 } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { formatarData } from "@/lib/formatadores"

const BADGES_PLANO: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  trial: { label: "Essencial", variant: "secondary" },
  crm_ia: { label: "Profissional", variant: "default" },
  crm_ia_sdr: { label: "Completo", variant: "success" },
}

const BADGES_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  active: { label: "Ativo", variant: "success" },
  trialing: { label: "Trial", variant: "secondary" },
  past_due: { label: "Atrasado", variant: "warning" },
  canceled: { label: "Cancelado", variant: "destructive" },
}

type Organizacao = {
  id: string
  nome: string
  slug: string
  plano: string
  plano_status: string
  trial_fim_em: string | null
  created_at: string
  qtd_usuarios: number
  qtd_imoveis: number
}

type ColunasVisiveis = {
  slug: boolean
  plano: boolean
  status: boolean
  usuarios: boolean
  imoveis: boolean
  trialAte: boolean
  criadaEm: boolean
}

const colunasPadrao: ColunasVisiveis = {
  slug: true,
  plano: true,
  status: true,
  usuarios: true,
  imoveis: true,
  trialAte: true,
  criadaEm: true,
}

interface TabelaOrganizacoesProps {
  organizacoes: Organizacao[]
  total?: number
  mostraFinanceiro: boolean
  filtros?: React.ReactNode
  paginacao?: React.ReactNode
}

export function TabelaOrganizacoes({
  organizacoes,
  total = 0,
  mostraFinanceiro,
  filtros,
  paginacao,
}: TabelaOrganizacoesProps) {
  const [colunas, setColunas] = useState<ColunasVisiveis>(colunasPadrao)

  function toggleColuna(col: keyof ColunasVisiveis) {
    setColunas((prev) => ({ ...prev, [col]: !prev[col] }))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {filtros ? (
          <div className="flex-1">{filtros}</div>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "organização encontrada" : "organizações encontradas"}
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
              checked={colunas.slug}
              onCheckedChange={() => toggleColuna("slug")}
            >
              Slug
            </DropdownMenuCheckboxItem>
            {mostraFinanceiro && (
              <DropdownMenuCheckboxItem
                checked={colunas.plano}
                onCheckedChange={() => toggleColuna("plano")}
              >
                Plano
              </DropdownMenuCheckboxItem>
            )}
            {mostraFinanceiro && (
              <DropdownMenuCheckboxItem
                checked={colunas.status}
                onCheckedChange={() => toggleColuna("status")}
              >
                Status
              </DropdownMenuCheckboxItem>
            )}
            <DropdownMenuCheckboxItem
              checked={colunas.usuarios}
              onCheckedChange={() => toggleColuna("usuarios")}
            >
              Usuários
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={colunas.imoveis}
              onCheckedChange={() => toggleColuna("imoveis")}
            >
              Imóveis
            </DropdownMenuCheckboxItem>
            {mostraFinanceiro && (
              <DropdownMenuCheckboxItem
                checked={colunas.trialAte}
                onCheckedChange={() => toggleColuna("trialAte")}
              >
                Trial até
              </DropdownMenuCheckboxItem>
            )}
            <DropdownMenuCheckboxItem
              checked={colunas.criadaEm}
              onCheckedChange={() => toggleColuna("criadaEm")}
            >
              Criada em
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {colunas.slug && <TableHead>Slug</TableHead>}
              {mostraFinanceiro && colunas.plano && <TableHead>Plano</TableHead>}
              {mostraFinanceiro && colunas.status && <TableHead>Status</TableHead>}
              {colunas.usuarios && <TableHead className="text-center">Usuários</TableHead>}
              {colunas.imoveis && <TableHead className="text-center">Imóveis</TableHead>}
              {mostraFinanceiro && colunas.trialAte && <TableHead>Trial até</TableHead>}
              {colunas.criadaEm && <TableHead>Criada em</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizacoes.map((org) => {
              const badgePlano = BADGES_PLANO[org.plano] ?? { label: org.plano, variant: "secondary" as const }
              const badgeStatus = BADGES_STATUS[org.plano_status] ?? { label: org.plano_status, variant: "secondary" as const }

              return (
                <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link href={`/admin/organizacoes/${org.id}`} className="hover:underline">
                      {org.nome}
                    </Link>
                  </TableCell>
                  {colunas.slug && (
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {org.slug}
                    </TableCell>
                  )}
                  {mostraFinanceiro && colunas.plano && (
                    <TableCell>
                      <Badge variant={badgePlano.variant}>{badgePlano.label}</Badge>
                    </TableCell>
                  )}
                  {mostraFinanceiro && colunas.status && (
                    <TableCell>
                      <Badge variant={badgeStatus.variant}>{badgeStatus.label}</Badge>
                    </TableCell>
                  )}
                  {colunas.usuarios && (
                    <TableCell className="text-center">{org.qtd_usuarios}</TableCell>
                  )}
                  {colunas.imoveis && (
                    <TableCell className="text-center">{org.qtd_imoveis}</TableCell>
                  )}
                  {mostraFinanceiro && colunas.trialAte && (
                    <TableCell className="text-muted-foreground text-sm">
                      {org.trial_fim_em ? formatarData(org.trial_fim_em) : "—"}
                    </TableCell>
                  )}
                  {colunas.criadaEm && (
                    <TableCell className="text-muted-foreground text-sm">
                      {formatarData(org.created_at)}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
            {organizacoes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhuma organização encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtros && paginacao && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "organização encontrada" : "organizações encontradas"}
          </p>
          {paginacao}
        </div>
      )}
    </div>
  )
}
