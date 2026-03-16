import { Building2 } from "lucide-react"

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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Building2 className="h-8 w-8" />
          </div>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
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
