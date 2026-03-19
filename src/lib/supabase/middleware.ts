import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function atualizarSessao(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Helper: redirecionar propagando cookies refreshed do Supabase
  function redirecionarComCookies(url: URL) {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  const pathname = request.nextUrl.pathname

  // Rotas que EXIGEM autenticação (dashboard e sub-rotas)
  const rotasProtegidas = [
    "/painel",
    "/imoveis",
    "/clientes",
    "/negocios",
    "/atividades",
    "/integracoes",
    "/conversas",
    "/meu-site",
    "/financeiro",
    "/configuracoes",
    "/usuarios",
  ]
  const ehRotaProtegida =
    rotasProtegidas.some((rota) => pathname.startsWith(rota))

  // Rotas de autenticação (login, cadastro, etc.)
  const rotasAuth = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha", "/auth/callback"]
  const ehRotaAuth = rotasAuth.some((rota) => pathname.startsWith(rota))

  // Usuário autenticado acessando a landing page → redirecionar para o painel
  if (user && pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/painel"
    return redirecionarComCookies(url)
  }

  // Site público e outras rotas: não é dashboard nem auth → passar sem checar
  if (!ehRotaProtegida && !ehRotaAuth) {
    return supabaseResponse
  }

  // Se não está autenticado e tenta acessar rota protegida → redireciona para login
  if (!user && ehRotaProtegida) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return redirecionarComCookies(url)
  }

  // Se está autenticado e tenta acessar rota de auth → redireciona para painel
  // Exceções:
  // - ?erro= do layout (sessão inválida) → deixar passar para evitar loop
  // - /redefinir-senha → usuário está no meio do fluxo de recuperação de senha
  if (user && ehRotaAuth) {
    const ehRedefinirSenha = pathname.startsWith("/redefinir-senha")
    if (!request.nextUrl.searchParams.has("erro") && !ehRedefinirSenha) {
      const url = request.nextUrl.clone()
      url.pathname = "/painel"
      return redirecionarComCookies(url)
    }
  }

  // Verificar trial expirado para usuários autenticados
  // Rotas permitidas mesmo com trial expirado
  const rotasLivresTrial = ["/financeiro", "/configuracoes"]
  const ehRotaLivreTrial = rotasLivresTrial.some((rota) =>
    pathname.startsWith(rota)
  )

  if (user && ehRotaProtegida && !ehRotaLivreTrial) {
    // Buscar plano e trial da organização
    const { data: org } = await supabase
      .from("organizacoes")
      .select("plano, trial_fim_em")
      .single()

    if (org?.plano === "trial" && org.trial_fim_em) {
      const trialFim = new Date(org.trial_fim_em)
      if (trialFim < new Date()) {
        const url = request.nextUrl.clone()
        url.pathname = "/financeiro"
        url.searchParams.set("trial_expirado", "true")
        return redirecionarComCookies(url)
      }
    }
  }

  return supabaseResponse
}
