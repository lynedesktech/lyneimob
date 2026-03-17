import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function SecaoCtaFinal() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-grad-start via-grad-mid to-grad-end py-20 sm:py-28">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute top-10 right-20 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-10 left-20 h-64 w-64 rounded-full bg-accent-blue blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Pronto para vender mais?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
          Junte-se aos corretores que já usam IA pra fechar mais negócios.
          Comece agora e veja a diferença em 14 dias.
        </p>
        <div className="mt-10">
          <Link href="/cadastro">
            <Button
              size="lg"
              className="h-14 gap-2 rounded-xl bg-white px-10 text-base font-semibold text-grad-mid shadow-lg shadow-black/20 transition-all hover:bg-white/90 hover:shadow-xl"
            >
              Comece grátis por 14 dias
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-white/50">
          Sem cartão de crédito. Sem compromisso. Cancele quando quiser.
        </p>
      </div>
    </section>
  )
}
