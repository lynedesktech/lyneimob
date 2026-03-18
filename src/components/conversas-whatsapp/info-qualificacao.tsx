"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Home,
  Target,
  MapPin,
  DollarSign,
  Zap,
  FileText,
  User,
  Briefcase,
} from "lucide-react"
import type { ConversaComRelacoes, QualificacaoLead } from "@/types/whatsapp"
import { formatarPreco as formatarPrecoBase } from "@/lib/formatadores"

interface InfoQualificacaoProps {
  conversa: ConversaComRelacoes
}

const coresUrgencia: Record<string, string> = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-warning/10 text-warning",
  baixa: "bg-success/10 text-success",
}

const labelsUrgencia: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
}

function formatarPreco(valor?: number) {
  if (!valor) return null
  return formatarPrecoBase(valor)
}

function SecaoQualificacao({ qualificacao }: { qualificacao: QualificacaoLead }) {
  const temDados =
    qualificacao.tipo_imovel ||
    qualificacao.finalidade ||
    (qualificacao.bairros && qualificacao.bairros.length > 0) ||
    qualificacao.faixa_preco ||
    qualificacao.urgencia

  if (!temDados) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum dado de qualificação coletado ainda.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {qualificacao.tipo_imovel && (
        <div className="flex items-center gap-2 text-sm">
          <Home className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Tipo:</span>
          <span className="font-medium">{qualificacao.tipo_imovel}</span>
        </div>
      )}

      {qualificacao.finalidade && (
        <div className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Finalidade:</span>
          <span className="font-medium">{qualificacao.finalidade}</span>
        </div>
      )}

      {qualificacao.bairros && qualificacao.bairros.length > 0 && (
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <span className="text-muted-foreground">Bairros:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {qualificacao.bairros.map((bairro) => (
                <Badge key={bairro} variant="outline" className="text-xs">
                  {bairro}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {qualificacao.faixa_preco && (qualificacao.faixa_preco.min || qualificacao.faixa_preco.max) && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Faixa:</span>
          <span className="font-medium">
            {formatarPreco(qualificacao.faixa_preco.min) || "?"}
            {" — "}
            {formatarPreco(qualificacao.faixa_preco.max) || "?"}
          </span>
        </div>
      )}

      {qualificacao.urgencia && (
        <div className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Urgência:</span>
          <Badge className={`text-xs ${coresUrgencia[qualificacao.urgencia]}`}>
            {labelsUrgencia[qualificacao.urgencia]}
          </Badge>
        </div>
      )}

      {qualificacao.observacoes && (
        <div className="flex items-start gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <span className="text-muted-foreground">Observações:</span>
            <p className="mt-1 text-xs">{qualificacao.observacoes}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function InfoQualificacao({ conversa }: InfoQualificacaoProps) {
  return (
    <div className="space-y-4">
      {/* Qualificação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Qualificação do Lead</CardTitle>
        </CardHeader>
        <CardContent>
          {conversa.qualificacao ? (
            <SecaoQualificacao qualificacao={conversa.qualificacao} />
          ) : (
            <p className="text-sm text-muted-foreground">
              A IA ainda não coletou dados de qualificação.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Vinculações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Vinculações na plataforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversa.clientes ? (
            <Link
              href={`/clientes/${conversa.clientes.id}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <User className="h-4 w-4" />
              {conversa.clientes.nome}
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Nenhum cliente vinculado
            </div>
          )}

          {conversa.negocios ? (
            <Link
              href={`/negocios/${conversa.negocios.id}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Briefcase className="h-4 w-4" />
              {conversa.negocios.titulo}
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              Nenhum negócio vinculado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo IA */}
      {conversa.resumo_ia && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resumo da IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{conversa.resumo_ia}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
