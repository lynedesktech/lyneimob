import { Resend } from "resend"

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

interface OpcoesEmail {
  para: string | string[]
  assunto: string
  html: string
  de?: string
}

export async function enviarEmail({ para, assunto, html, de }: OpcoesEmail) {
  const resend = getResend()

  const { data, error } = await resend.emails.send({
    from: de ?? process.env.RESEND_FROM_EMAIL ?? "LyneImob <noreply@lyneimob.com>",
    to: Array.isArray(para) ? para : [para],
    subject: assunto,
    html,
  })

  if (error) {
    console.error("[enviarEmail] Erro ao enviar:", error)
    throw new Error(`Erro ao enviar email: ${error.message}`)
  }

  return data
}
