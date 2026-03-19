import { redirect } from "next/navigation"
import Link from "next/link"
import { criarClienteServer } from "@/lib/supabase/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
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
import { formatarData } from "@/lib/formatadores"
import { ehPerfilPlataforma, temAcessoFinanceiro } from "@/lib/permissoes"

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

export default async function AdminOrganizacoesPage() {
  // Guard: verificar se é super_admin
  const supabase = await criarClienteServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("super_admin, perfil_plataforma")
    .eq("id", user.id)
    .single()

  if (!ehPerfilPlataforma(usuario)) redirect("/painel")

  const mostraFinanceiro = temAcessoFinanceiro(usuario)

  // Buscar todas as organizações com contagens
  const admin = criarClienteAdmin()

  const { data: organizacoes } = await admin
    .from("organizacoes")
    .select("id, nome, slug, plano, plano_status, trial_fim_em, created_at")
    .order("created_at", { ascending: false })

  // Buscar contagens de usuários e imóveis por org
  const orgIds = organizacoes?.map((o) => o.id) ?? []

  const [{ data: usuariosPorOrg }, { data: imoveisPorOrg }] = await Promise.all([
    admin.from("usuarios").select("organizacao_id").in("organizacao_id", orgIds),
    admin.from("imoveis").select("organizacao_id").in("organizacao_id", orgIds),
  ])

  // Contar por org
  const contarPorOrg = (dados: { organizacao_id: string }[] | null, orgId: string) =>
    dados?.filter((d) => d.organizacao_id === orgId).length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizações</h1>
        <p className="text-muted-foreground">
          Todas as imobiliárias cadastradas na plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {organizacoes?.length ?? 0} organização{(organizacoes?.length ?? 0) !== 1 ? "ões" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                {mostraFinanceiro && <TableHead>Plano</TableHead>}
                {mostraFinanceiro && <TableHead>Status</TableHead>}
                <TableHead className="text-center">Usuários</TableHead>
                <TableHead className="text-center">Imóveis</TableHead>
                {mostraFinanceiro && <TableHead>Trial até</TableHead>}
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizacoes?.map((org) => {
                const badgePlano = BADGES_PLANO[org.plano] ?? { label: org.plano, variant: "secondary" as const }
                const badgeStatus = BADGES_STATUS[org.plano_status] ?? { label: org.plano_status, variant: "secondary" as const }
                const qtdUsuarios = contarPorOrg(usuariosPorOrg, org.id)
                const qtdImoveis = contarPorOrg(imoveisPorOrg, org.id)

                return (
                  <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/admin/organizacoes/${org.id}`} className="hover:underline">
                        {org.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {org.slug}
                    </TableCell>
                    {mostraFinanceiro && (
                      <TableCell>
                        <Badge variant={badgePlano.variant}>{badgePlano.label}</Badge>
                      </TableCell>
                    )}
                    {mostraFinanceiro && (
                      <TableCell>
                        <Badge variant={badgeStatus.variant}>{badgeStatus.label}</Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-center">{qtdUsuarios}</TableCell>
                    <TableCell className="text-center">{qtdImoveis}</TableCell>
                    {mostraFinanceiro && (
                      <TableCell className="text-muted-foreground text-sm">
                        {org.trial_fim_em ? formatarData(org.trial_fim_em) : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground text-sm">
                      {formatarData(org.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!organizacoes || organizacoes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={mostraFinanceiro ? 8 : 5} className="text-center text-muted-foreground py-8">
                    Nenhuma organização encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
