import { NextResponse } from "next/server"
import { criarClienteAdmin } from "@/lib/supabase/admin"
import { gerarFeedXml } from "@/lib/xml/vrsync"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug) {
    return NextResponse.json({ erro: "Slug não informado" }, { status: 400 })
  }

  const supabase = criarClienteAdmin()

  // Buscar organizacao pelo slug
  const { data: empresa, error: erroEmpresa } = await supabase
    .from("organizacoes")
    .select("id, nome, email, telefone, slug")
    .eq("slug", slug)
    .single()

  if (erroEmpresa || !empresa) {
    return NextResponse.json(
      { erro: "Organização não encontrada" },
      { status: 404 }
    )
  }

  // Buscar imóveis disponíveis (sem filtro publicar_portais — não existe no banco)
  const { data: imoveis, error: erroImoveis } = await supabase
    .from("imoveis")
    .select("*")
    .eq("organizacao_id", empresa.id)
    .eq("status", "disponivel")
    .order("created_at", { ascending: false })

  if (erroImoveis) {
    return NextResponse.json(
      { erro: "Erro ao buscar imóveis" },
      { status: 500 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const resultado = gerarFeedXml(
    imoveis || [],
    empresa,
    appUrl
  )

  return new Response(resultado.xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
