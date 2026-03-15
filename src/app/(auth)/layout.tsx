export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">LyneImob</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            CRM Imobiliário Inteligente
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
