import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { obterUsuarioAutenticado, obterDadosUsuario } from "@/lib/supabase/queries"
import { ehSuperAdmin, ehDesenvolvedor } from "@/lib/permissoes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { lerMetricasCallback } from "@/lib/observabilidade/callback-railway"

// Pagina nao deve ser cacheada — metricas sao em tempo real
export const dynamic = "force-dynamic"
export const revalidate = 0

function formatarTimestamp(iso: string | null): string {
  if (!iso) return "Nenhum callback registrado"
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  })
}

function formatarLatencia(ms: number | null): string {
  return ms == null ? "—" : `${ms} ms`
}

export default async function ObservabilidadeCallbackRailwayPage() {
  const user = await obterUsuarioAutenticado()
  if (!user) redirect("/login")

  const usuario = await obterDadosUsuario(user.id)
  if (!usuario || (!ehSuperAdmin(usuario) && !ehDesenvolvedor(usuario))) {
    redirect("/painel")
  }

  const m = await lerMetricasCallback()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/admin" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Callback Railway → CRM
          </h1>
          <p className="text-sm text-muted-foreground">
            Observabilidade do endpoint <code className="text-xs">/api/interno/criar-cliente-negocio</code> nas ultimas 24h
          </p>
        </div>
      </div>

      {!m.redis_disponivel && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">
              Redis nao configurado — metricas nao estao sendo gravadas. Configure as variaveis <code>UPSTASH_REDIS_REST_URL</code> e <code>UPSTASH_REDIS_REST_TOKEN</code>.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-success" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{m.taxa_sucesso_pct}%</p>
            <p className="text-xs text-muted-foreground">
              {m.total_24h} chamadas em 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Sucessos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{m.success_count_24h}</p>
            <p className="text-xs text-muted-foreground">
              + {m.already_exists_count_24h} ja existentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-destructive" />
              Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{m.fail_count_24h}</p>
            <p className="text-xs text-muted-foreground">ultimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-warning" />
              Ultimo Callback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {formatarTimestamp(m.ultimo_callback_em)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Latencia
            <span className="text-xs font-normal text-muted-foreground">
              (amostra: {m.latencias_amostra} chamadas mais recentes)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">P50 (mediana)</p>
              <p className="text-2xl font-bold">{formatarLatencia(m.latencia_p50_ms)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">P95</p>
              <p className="text-2xl font-bold">{formatarLatencia(m.latencia_p95_ms)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">P99</p>
              <p className="text-2xl font-bold">{formatarLatencia(m.latencia_p99_ms)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
