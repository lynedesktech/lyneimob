import { type NextRequest } from "next/server"
import { atualizarSessao } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await atualizarSessao(request)
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Arquivos públicos (imagens, fontes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
