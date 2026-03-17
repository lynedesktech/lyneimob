"use client"

import { ConfigDistribuicao } from "@/components/integracoes/config-distribuicao"
import { CargaCorretores } from "@/components/integracoes/carga-corretores"

export function ConteudoDistribuicao() {
  return (
    <div className="space-y-6">
      <ConfigDistribuicao />
      <CargaCorretores />
    </div>
  )
}
