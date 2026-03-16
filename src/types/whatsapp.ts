import { z } from "zod"

// ============================================================
// Enums
// ============================================================

export type StatusConversa = "em_andamento" | "qualificado" | "encaminhado" | "finalizado" | "arquivado"

export type DirecaoMensagem = "recebida" | "enviada"

export type TipoConteudo = "texto" | "audio" | "imagem" | "documento" | "video" | "sticker" | "localizacao"

// ============================================================
// Tipos do Banco
// ============================================================

export type StatusInstancia = "disconnected" | "connecting" | "connected"

export type RespostaInstanciaUazapi = {
  instance: {
    id: string
    token: string
    status: StatusInstancia
    qrcode?: string
    paircode?: string
    name: string
    profileName?: string
    profilePicUrl?: string
    isBusiness?: boolean
  }
  status?: {
    connected: boolean
    loggedIn: boolean
    jid: string | null
  }
}

export type ConfigWhatsapp = {
  id: string
  organizacao_id: string
  uazapi_url: string
  uazapi_token: string
  instance_id: string | null
  numero_whatsapp: string | null
  ativo: boolean
  prompt_personalizado: string | null
  horario_atendimento: HorarioAtendimento | null
  mensagem_fora_horario: string | null
  corretor_padrao_id: string | null
  criado_em: string
  atualizado_em: string
}

export type HorarioAtendimento = {
  segunda?: { inicio: string; fim: string }
  terca?: { inicio: string; fim: string }
  quarta?: { inicio: string; fim: string }
  quinta?: { inicio: string; fim: string }
  sexta?: { inicio: string; fim: string }
  sabado?: { inicio: string; fim: string }
  domingo?: { inicio: string; fim: string }
}

export type ConversaWhatsapp = {
  id: string
  organizacao_id: string
  numero_cliente: string
  nome_cliente: string | null
  foto_url: string | null
  status: StatusConversa
  resumo_ia: string | null
  qualificacao: QualificacaoLead | null
  cliente_id: string | null
  negocio_id: string | null
  corretor_id: string | null
  ultima_mensagem_em: string
  criado_em: string
  atualizado_em: string
}

export type QualificacaoLead = {
  tipo_imovel?: string
  finalidade?: string
  bairros?: string[]
  faixa_preco?: { min?: number; max?: number }
  urgencia?: "alta" | "media" | "baixa"
  observacoes?: string
}

export type MensagemWhatsapp = {
  id: string
  conversa_id: string
  organizacao_id: string
  direcao: DirecaoMensagem
  tipo_conteudo: TipoConteudo
  conteudo: string | null
  conteudo_original: string | null
  midia_url: string | null
  message_id_whatsapp: string | null
  metadata: Record<string, unknown> | null
  criado_em: string
}

export type ConversaComMensagens = ConversaWhatsapp & {
  mensagens_whatsapp: MensagemWhatsapp[]
}

export type ConversaComRelacoes = ConversaWhatsapp & {
  clientes: { id: string; nome: string; telefone: string | null; email: string | null } | null
  negocios: { id: string; titulo: string; status: string } | null
  usuarios: { id: string; nome: string } | null
}

// ============================================================
// Schemas Zod
// ============================================================

export const schemaConfigWhatsapp = z.object({
  uazapi_url: z.string().url("URL da Uazapi inválida"),
  uazapi_token: z.string().min(1, "Token da Uazapi é obrigatório"),
  numero_whatsapp: z.string().min(10, "Número do WhatsApp inválido").optional().or(z.literal("")),
  ativo: z.boolean().optional(),
  prompt_personalizado: z.string().optional().or(z.literal("")),
  horario_atendimento: z.string().optional().or(z.literal("")),
  mensagem_fora_horario: z.string().optional().or(z.literal("")),
  corretor_padrao_id: z.string().optional().or(z.literal("")),
})

export type ConfigWhatsappInput = z.infer<typeof schemaConfigWhatsapp>

export const schemaFiltrosConversas = z.object({
  status: z.enum(["em_andamento", "qualificado", "encaminhado", "finalizado", "arquivado"]).optional(),
  busca: z.string().optional(),
  corretor_id: z.string().optional(),
  pagina: z.number().optional(),
  por_pagina: z.number().optional(),
})

export type FiltrosConversasInput = z.infer<typeof schemaFiltrosConversas>

// ============================================================
// Payload da Uazapi (webhook incoming)
// ============================================================

export const schemaPayloadUazapi = z.object({
  event: z.string(),
  instance: z.string().optional(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
    }),
    pushName: z.string().optional(),
    message: z.object({
      conversation: z.string().optional(),
      extendedTextMessage: z.object({
        text: z.string().optional(),
      }).optional(),
      imageMessage: z.object({
        url: z.string().optional(),
        caption: z.string().optional(),
        mimetype: z.string().optional(),
      }).optional(),
      audioMessage: z.object({
        url: z.string().optional(),
        mimetype: z.string().optional(),
        seconds: z.number().optional(),
      }).optional(),
      documentMessage: z.object({
        url: z.string().optional(),
        fileName: z.string().optional(),
        mimetype: z.string().optional(),
      }).optional(),
      videoMessage: z.object({
        url: z.string().optional(),
        caption: z.string().optional(),
        mimetype: z.string().optional(),
      }).optional(),
      stickerMessage: z.object({
        url: z.string().optional(),
      }).optional(),
      locationMessage: z.object({
        degreesLatitude: z.number().optional(),
        degreesLongitude: z.number().optional(),
      }).optional(),
    }).optional(),
    messageTimestamp: z.union([z.string(), z.number()]).optional(),
  }),
})

export type PayloadUazapi = z.infer<typeof schemaPayloadUazapi>

// ============================================================
// Tipos auxiliares do agente
// ============================================================

export type MensagemProcessada = {
  tipo: TipoConteudo
  conteudo: string
  conteudo_original?: string
  midia_url?: string
  metadata?: Record<string, unknown>
}

export type ContextoAgente = {
  organizacao_id: string
  conversa_id: string
  config: ConfigWhatsapp
  numero_cliente: string
}
