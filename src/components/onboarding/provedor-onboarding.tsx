"use client"

import { OnbordaProvider, Onborda } from "onborda"
import { useOnboarding } from "@/hooks/use-onboarding"
import { CardOnboarding } from "@/components/onboarding/card-onboarding"

// ============================================================
// Steps do tour de boas-vindas
// ============================================================

const stepsTour = [
  {
    tour: "boas-vindas",
    steps: [
      {
        icon: <>👋</>,
        title: "Bem-vindo ao LyneImob!",
        content: (
          <>
            Este é o menu principal da sua plataforma. Aqui você encontra todos os
            módulos — imóveis, clientes, negócios, atividades e muito mais.
          </>
        ),
        selector: "#onborda-sidebar-nav",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>📊</>,
        title: "Seu painel de controle",
        content: (
          <>
            O dashboard mostra um resumo de tudo: negócios abertos, clientes
            cadastrados, imóveis ativos e atividades do dia.
          </>
        ),
        selector: "#onborda-dashboard-cards",
        side: "bottom" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🔍</>,
        title: "Busca rápida",
        content: (
          <>
            Use <strong>Ctrl+K</strong> pra encontrar qualquer coisa
            rapidamente — imóveis, clientes ou negócios. Sem precisar navegar
            pelo menu.
          </>
        ),
        selector: "#onborda-busca-global",
        side: "bottom" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🚀</>,
        title: "Comece por aqui!",
        content: (
          <>
            Use as ações rápidas pra cadastrar seu primeiro imóvel, cliente ou
            negócio. Logo abaixo você vai ver um checklist pra te guiar nos
            primeiros passos.
          </>
        ),
        selector: "#onborda-acoes-rapidas",
        side: "top" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
    ],
  },
]

// ============================================================
// Provedor
// ============================================================

export function ProvedorOnboarding({ children }: { children: React.ReactNode }) {
  const { tourCompleto, carregando, marcarTour } = useOnboarding()

  // Enquanto carrega, não mostra o tour
  if (carregando) {
    return <>{children}</>
  }

  return (
    <OnbordaProvider>
      <Onborda
        steps={stepsTour}
        showOnborda={!tourCompleto}
        shadowRgb="0,0,0"
        shadowOpacity="0.6"
        cardComponent={CardOnboarding}
        cardTransition={{ duration: 0.3, type: "tween" }}
      >
        {children}
      </Onborda>
    </OnbordaProvider>
  )
}
