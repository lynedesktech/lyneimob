"use client"

import { useQuery } from "@tanstack/react-query"
import { criarClienteBrowser } from "@/lib/supabase/client"
import { BotaoExportar } from "@/components/ui/botao-exportar"

export function ResumoNegocios() {
  const supabase = criarClienteBrowser()

  const { data } = useQuery({
    queryKey: ["negocios-resumo"],
    queryFn: async () => {
      const { data: negocios, count } = await supabase
        .from("negocios")
        .select("valor", { count: "exact" })
        .eq("status", "aberto")

      const total = count ?? 0
      const totalValor = (negocios ?? []).reduce((acc, n) => acc + (n.valor || 0), 0)

      return { total, totalValor }
    },
  })

  const total = data?.total ?? 0
  const totalValor = data?.totalValor ?? 0

  return (
    <div className="animate-fade-in-up flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {total} negócio{total !== 1 ? "s" : ""} aberto
        {total !== 1 ? "s" : ""}
        {totalValor > 0 && (
          <>
            {" "}
            — Total:{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalValor)}
          </>
        )}
      </p>
      <BotaoExportar
        modulo="negocios"
        filtros={{}}
        total={total}
      />
    </div>
  )
}
