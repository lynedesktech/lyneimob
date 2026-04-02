"use client"

import { ThemeProvider } from "next-themes"

export function ProvedorTemaSite({
  tema = "claro",
  children,
}: {
  tema?: "claro" | "escuro"
  children: React.ReactNode
}) {
  return (
    <ThemeProvider forcedTheme={tema === "escuro" ? "dark" : "light"}>
      {children}
    </ThemeProvider>
  )
}

// Manter export antigo para compatibilidade
export function ProvedorTemaClaro({ children }: { children: React.ReactNode }) {
  return <ProvedorTemaSite tema="claro">{children}</ProvedorTemaSite>
}
