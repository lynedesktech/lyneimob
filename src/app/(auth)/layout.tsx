import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — imagem de imóvel (oculto em mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
          alt="Imóvel de alto padrão"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="relative z-10 flex flex-col items-center justify-end w-full px-12 pb-16">
          <div className="max-w-sm space-y-4 text-center">
            <Image
              src="/logo-branco.png"
              alt="LyneImob"
              width={200}
              height={50}
              className="h-12 w-auto mx-auto"
            />
            <h1 className="text-3xl font-bold tracking-tight text-white">
              LyneImob
            </h1>
            <p className="text-white/70 text-sm">
              Gerencie imóveis, clientes e negócios em um só lugar — com IA que analisa, sugere e automatiza.
            </p>
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <Image
              src="/logo-preto.png"
              alt="LyneImob"
              width={160}
              height={40}
              className="h-10 w-auto"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">LyneImob</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                CRM Imobiliário Inteligente
              </p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
