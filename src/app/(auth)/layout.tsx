import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — branding (oculto em mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary px-12 text-primary-foreground">
        <div className="max-w-sm space-y-6 text-center">
          <Image
            src="/logo-branco.png"
            alt="LyneImob"
            width={200}
            height={50}
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">LyneImob</h1>
            <p className="mt-2 text-primary-foreground/70">
              CRM Imobiliário Inteligente
            </p>
          </div>
          <div className="space-y-4 text-sm text-primary-foreground/60">
            <p>Gerencie imóveis, clientes e negócios em um só lugar — com IA que analisa, sugere e automatiza.</p>
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
