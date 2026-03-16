import { Play } from "lucide-react"

export function SecaoVideo() {
  return (
    <section id="video" className="bg-muted/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header da seção */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-[#3b82f6] uppercase">
            Demonstração
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Veja o LyneImob em ação
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Descubra como o CRM com IA pode transformar a forma como você vende
            imóveis.
          </p>
        </div>

        {/* Placeholder do vídeo */}
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#023373] to-[#011a42] shadow-2xl shadow-[#023373]/20">
            <div className="aspect-video flex items-center justify-center">
              {/* Padrão decorativo */}
              <div className="absolute inset-0 opacity-[0.05]">
                <div className="absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-white blur-3xl" />
                <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-blue-400 blur-3xl" />
              </div>

              {/* Botão play */}
              <div className="relative flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg">
                    <Play className="h-6 w-6 text-[#023373] ml-0.5" />
                  </div>
                </div>
                <span className="text-sm font-medium text-white/60">
                  Vídeo em breve
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
