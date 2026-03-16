"use client"

import { Mic, Image, FileText, Video, MapPin, Sticker } from "lucide-react"
import type { MensagemWhatsapp, TipoConteudo } from "@/types/whatsapp"

interface HistoricoConversaProps {
  mensagens: MensagemWhatsapp[]
}

const iconesConteudo: Record<TipoConteudo, React.ElementType> = {
  texto: () => null,
  audio: Mic,
  imagem: Image,
  documento: FileText,
  video: Video,
  sticker: Sticker,
  localizacao: MapPin,
}

const labelsConteudo: Record<TipoConteudo, string> = {
  texto: "",
  audio: "Áudio",
  imagem: "Imagem",
  documento: "Documento",
  video: "Vídeo",
  sticker: "Sticker",
  localizacao: "Localização",
}

function formatarHora(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data))
}

function formatarData(data: string) {
  const hoje = new Date()
  const dataMsg = new Date(data)

  const ehHoje =
    hoje.getDate() === dataMsg.getDate() &&
    hoje.getMonth() === dataMsg.getMonth() &&
    hoje.getFullYear() === dataMsg.getFullYear()

  if (ehHoje) return "Hoje"

  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)
  const ehOntem =
    ontem.getDate() === dataMsg.getDate() &&
    ontem.getMonth() === dataMsg.getMonth() &&
    ontem.getFullYear() === dataMsg.getFullYear()

  if (ehOntem) return "Ontem"

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(dataMsg)
}

function agruparPorData(mensagens: MensagemWhatsapp[]) {
  const grupos: Record<string, MensagemWhatsapp[]> = {}

  for (const msg of mensagens) {
    const dataChave = new Date(msg.criado_em).toDateString()
    if (!grupos[dataChave]) {
      grupos[dataChave] = []
    }
    grupos[dataChave].push(msg)
  }

  return Object.entries(grupos).map(([dataChave, msgs]) => ({
    data: dataChave,
    label: formatarData(msgs[0].criado_em),
    mensagens: msgs,
  }))
}

function BolhaMensagem({ mensagem }: { mensagem: MensagemWhatsapp }) {
  const ehEnviada = mensagem.direcao === "enviada"
  const IconeConteudo = iconesConteudo[mensagem.tipo_conteudo]
  const labelConteudo = labelsConteudo[mensagem.tipo_conteudo]

  return (
    <div className={`flex ${ehEnviada ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          ehEnviada
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        }`}
      >
        {/* Indicador de tipo de conteúdo */}
        {mensagem.tipo_conteudo !== "texto" && (
          <div className={`flex items-center gap-1.5 text-xs mb-1 ${
            ehEnviada ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}>
            <IconeConteudo className="h-3.5 w-3.5" />
            <span>{labelConteudo}</span>
          </div>
        )}

        {/* Conteúdo */}
        {mensagem.conteudo && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {mensagem.conteudo}
          </p>
        )}

        {/* Conteúdo original (transcrição) */}
        {mensagem.conteudo_original && mensagem.conteudo_original !== mensagem.conteudo && (
          <p className={`text-xs mt-1 italic ${
            ehEnviada ? "text-primary-foreground/60" : "text-muted-foreground"
          }`}>
            Transcrição: {mensagem.conteudo_original}
          </p>
        )}

        {/* Hora */}
        <p className={`text-[10px] mt-1 text-right ${
          ehEnviada ? "text-primary-foreground/60" : "text-muted-foreground"
        }`}>
          {formatarHora(mensagem.criado_em)}
        </p>
      </div>
    </div>
  )
}

export function HistoricoConversa({ mensagens }: HistoricoConversaProps) {
  if (mensagens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhuma mensagem nesta conversa.
        </p>
      </div>
    )
  }

  const grupos = agruparPorData(mensagens)

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <div key={grupo.data} className="space-y-3">
          {/* Separador de data */}
          <div className="flex items-center justify-center">
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {grupo.label}
            </span>
          </div>

          {/* Mensagens do dia */}
          <div className="space-y-2">
            {grupo.mensagens.map((mensagem) => (
              <BolhaMensagem key={mensagem.id} mensagem={mensagem} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
