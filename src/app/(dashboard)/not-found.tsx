import Link from "next/link"
import { Search, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NaoEncontradoDashboard() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="space-y-4 pt-8 pb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            A página que você procura não existe ou foi movida.
          </p>
          <Button render={<Link href="/painel" />} className="mt-2">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Painel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
