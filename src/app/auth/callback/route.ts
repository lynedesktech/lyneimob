import { NextResponse } from "next/server"
import { criarClienteServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/"

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
