"use client"

import { BannerTrial } from "@/components/planos/banner-trial"

interface BannerTrialLayoutProps {
  plano: string
  trialFimEm: string | null
}

export function BannerTrialLayout({ plano, trialFimEm }: BannerTrialLayoutProps) {
  if (plano !== "trial" || !trialFimEm) return null

  const trialFim = new Date(trialFimEm)
  const agora = new Date()
  const diff = trialFim.getTime() - agora.getTime()
  const diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  const expirado = diff <= 0

  // Só mostrar banner quando faltam 5 dias ou menos (ou expirado)
  if (!expirado && diasRestantes > 5) return null

  return (
    <div className="px-6 pt-4">
      <BannerTrial diasRestantes={diasRestantes} expirado={expirado} />
    </div>
  )
}
