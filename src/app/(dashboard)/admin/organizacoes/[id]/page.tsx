import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatarTelefone } from "@/lib/formatadores"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatarData } from "@/lib/formatadores"
import { ehPerfilPlataforma, ehSuperAdmin, temAcessoFinanceiro } from "@/lib/permissoes"
import { TabelaUsuariosOrg } from "@/components/admin/tabela-usuarios-org"
import { DialogNovoUsuario } from "@/components/admin/dialog-novo-usuario"
import {
  ArrowLeft,
  Building2,
  Users,
  CreditCard,
  Home,
  MapPin,
} from "lucide-react"

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

export default async function DetalheOrganizacaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Guard: verificar se é super_admin
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuarioLogado = await obterDadosUsuario(user.id)
  if (!ehPerfilPlataforma(usuarioLogado)) redirect("/painel")

  const mostraFinanceiro = temAcessoFinanceiro(usuarioLogado)
  const podeMudarUsuarios = ehSuperAdmin(usuarioLogado)

  // Buscar dados da organização
  const admin = criarClienteAdmin()

  const { data: org } = await admin
    .from("organizacoes")
    .select("*")
    .eq("id", id)
    .single()

  if (!org) notFound()

  // Buscar dados relacionados em paralelo
  const [
    { data: usuarios },
    { count: qtdImoveis },
    { count: qtdLoteamentos },
    { count: qtdNegocios },
    { count: qtdClientes },
  ] = await Promise.all([
    admin
      .from("usuarios")
      .select("id, nome, email, cargo, ativo, created_at")
      .eq("organizacao_id", id)
      .order("created_at", { ascending: true }),
    admin
      .from("imoveis")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", id),
    admin
      .from("loteamentos")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", id),
    admin
      .from("negocios")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", id),
    admin
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("organizacao_id", id),
  ])

  const badgePlano = BADGES_PLANO[org.plano] ?? { label: org.plano, variant: "secondary" as const }
  const badgeStatus = BADGES_STATUS[org.plano_status] ?? { label: org.plano_status, variant: "secondary" as const }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" render={<Link href="/admin/organizacoes" />}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{org.nome}</h1>
          <p className="text-sm text-muted-foreground font-mono">{org.slug}</p>
        </div>
        {mostraFinanceiro && (
          <div className="flex items-center gap-2">
            <Badge variant={badgePlano.variant}>{badgePlano.label}</Badge>
            <Badge variant={badgeStatus.variant}>{badgeStatus.label}</Badge>
          </div>
        )}
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usuarios?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Usuários</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{qtdImoveis ?? 0}</p>
              <p className="text-xs text-muted-foreground">Imóveis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{qtdLoteamentos ?? 0}</p>
              <p className="text-xs text-muted-foreground">Loteamentos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{qtdClientes ?? 0} / {qtdNegocios ?? 0}</p>
              <p className="text-xs text-muted-foreground">Clientes / Negócios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dados da empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Dados da empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium">{org.nome}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="font-mono text-xs">{org.slug}</dd>
              </div>
              {org.telefone && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Telefone</dt>
                  <dd>{formatarTelefone(org.telefone)}</dd>
                </div>
              )}
              {org.email && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{org.email}</dd>
                </div>
              )}
              {org.endereco && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Endereço</dt>
                  <dd className="text-right max-w-[200px]">{org.endereco}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Criada em</dt>
                <dd>{formatarData(org.created_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Informações financeiras — visível apenas para super admin */}
        {mostraFinanceiro && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plano</dt>
                  <dd><Badge variant={badgePlano.variant}>{badgePlano.label}</Badge></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd><Badge variant={badgeStatus.variant}>{badgeStatus.label}</Badge></dd>
                </div>
                {org.trial_fim_em && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Trial até</dt>
                    <dd>{formatarData(org.trial_fim_em)}</dd>
                  </div>
                )}
                {org.stripe_customer_id && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Stripe Customer</dt>
                    <dd className="font-mono text-xs">{org.stripe_customer_id}</dd>
                  </div>
                )}
                {org.stripe_subscription_id && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Stripe Subscription</dt>
                    <dd className="font-mono text-xs">{org.stripe_subscription_id}</dd>
                  </div>
                )}
                {org.limites && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Limites</dt>
                    <dd className="text-right text-xs">
                      {org.limites.max_imoveis} imóveis · {org.limites.max_corretores} corretores · {org.limites.max_loteamentos ?? "∞"} loteamentos
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de usuários */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Usuários ({usuarios?.length ?? 0})</h2>
          </div>
          {podeMudarUsuarios && (
            <DialogNovoUsuario
              organizacoes={[{ id: org.id, nome: org.nome }]}
              organizacaoFixa={{ id: org.id, nome: org.nome }}
            />
          )}
        </div>
        <TabelaUsuariosOrg
          usuarios={usuarios ?? []}
          ehSuperAdmin={podeMudarUsuarios}
        />
      </div>
    </div>
  )
}
