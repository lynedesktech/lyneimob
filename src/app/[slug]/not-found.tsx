import Link from "next/link"
import { Building2 } from "lucide-react"

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-muted-foreground">
        A imobiliária ou página que você procura não existe ou foi removida.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
