import { NextResponse } from "next/server"
import { criarClienteServer } from "@/lib/supabase/server"

type TipoOtpEmail = "invite" | "recovery" | "signup" | "magiclink" | "email_change" | "email"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/"

  // Convite de primeiro acesso (e qualquer link montado no servidor): chega
  // como token_hash e e validado aqui, no servidor. Esse caminho nao passa pelo
  // redirecionamento do Supabase, entao nao depende da lista de URLs permitidas
  // nem de cookie de PKCE no navegador de quem clicou — o link foi gerado por
  // outra pessoa (quem criou a conta), nao por este navegador.
  const tokenHash = searchParams.get("token_hash")
  if (tokenHash && type) {
    const supabase = await criarClienteServer()
    const { error } = await supabase.auth.verifyOtp({
      type: type as TipoOtpEmail,
      token_hash: tokenHash,
    })

    if (!error) {
      if (type === "invite") {
        return NextResponse.redirect(`${origin}/redefinir-senha?convite=1`)
      }
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/redefinir-senha`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }

    return NextResponse.redirect(`${origin}/esqueci-senha?erro=link-expirado`)
  }

  if (code) {
    const supabase = await criarClienteServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Se é recuperação de senha, redireciona pra página de redefinir
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/redefinir-senha`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se não tem code ou deu erro, redireciona com mensagem de erro
  return NextResponse.redirect(`${origin}/esqueci-senha?erro=link-expirado`)
}
