"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { User, Mail, Phone, Clock, Building2, MessageSquare } from "lucide-react"
import { AcoesLead } from "@/components/integracoes/acoes-lead"
import { StatusBadge } from "@/components/ui/status-badge"
import { configStatusLead } from "@/lib/constantes/status-configs"
import { formatarDataHora } from "@/lib/formatadores"
import type { LeadPortalComRelacoes } from "@/types/database"

interface CardLeadProps {
  lead: LeadPortalComRelacoes
}

const labelsPortal: Record<string, string> = {
  zap: "ZAP",
  olx: "OLX",
  vivareal: "VivaReal",
  imovelweb: "Imovelweb",
  site: "Site",
  whatsapp: "WhatsApp",
  outro: "Outro",
}

const coresPortal: Record<string, string> = {
  zap: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  olx: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  vivareal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  imovelweb: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  site: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
  whatsapp: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  outro: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
}

export function CardLead({ lead }: CardLeadProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Ícone */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            lead.status === "processado"
              ? "bg-success/10 text-success"
              : lead.status === "erro"
                ? "bg-destructive/10 text-destructive"
                : lead.status === "descartado"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
          }`}>
            <User className="h-5 w-5" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Nome e badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">
                {lead.nome || "Sem nome"}
              </p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${coresPortal[lead.portal]}`}>
                {labelsPortal[lead.portal]}
              </span>
              <StatusBadge status={lead.status} config={configStatusLead} className="text-xs" />
            </div>

            {/* Contato */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {lead.email}
                </span>
              )}
              {lead.telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.telefone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatarDataHora(lead.created_at)}
              </span>
            </div>

            {/* Mensagem */}
            {lead.mensagem && (
              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                <p className="line-clamp-2">{lead.mensagem}</p>
              </div>
            )}

            {/* Imóvel vinculado */}
            {lead.imoveis && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <Link href={`/imoveis/${lead.imoveis.id}`} className="hover:underline text-primary">
                  {lead.imoveis.codigo} — {lead.imoveis.titulo}
                </Link>
              </div>
            )}

            {/* Cliente/negócio vinculado (se processado) */}
            {lead.status === "processado" && lead.clientes && (
              <div className="flex items-center gap-3 text-xs">
                <Link href={`/clientes/${lead.clientes.id}`} className="text-primary hover:underline">
                  Cliente: {lead.clientes.nome}
                </Link>
                {lead.negocios && (
                  <Link href={`/negocios/${lead.negocios.id}`} className="text-primary hover:underline">
                    Negócio: {lead.negocios.titulo}
                  </Link>
                )}
              </div>
            )}

            {/* Erro */}
            {lead.status === "erro" && lead.erro_processamento && (
              <p className="text-xs text-destructive">{lead.erro_processamento}</p>
            )}
          </div>

          {/* Ações */}
          <div className="shrink-0">
            <AcoesLead lead={lead} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
