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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/45" />

        {/* Logo — canto superior esquerdo */}
        <div className="absolute top-8 left-8 z-10">
          <Image
            src="/logo-branco.png"
            alt="LyneImob"
            width={200}
            height={50}
            className="h-10 w-auto"
          />
        </div>

        {/* Texto de destaque — canto inferior esquerdo */}
        <div className="absolute bottom-12 left-8 right-8 z-10 max-w-lg">
          <h1 className="text-3xl font-bold leading-tight text-white text-shadow-lg">
            Gerencie imóveis, clientes e negócios{" "}
            <span className="text-accent-blue">em um só lugar</span>
          </h1>
          <p className="mt-3 text-white/70 text-sm text-shadow-sm">
            Monitore sua carteira, analise tendências e tome decisões estratégicas com dados e IA ao seu lado.
          </p>
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
            <p className="text-sm text-muted-foreground">
              Gestão Imobiliária Inteligente
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
