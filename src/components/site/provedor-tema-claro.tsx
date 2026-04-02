"use client"

/**
 * Wrapper que aplica o tema do site público (claro ou escuro)
 * diretamente via classe CSS, independente do ThemeProvider do sistema.
 *
 * Funciona porque o Tailwind v4 usa `&:is(.dark *)` como seletor,
 * então a classe .dark em qualquer elemento pai ativa o modo escuro
 * nos filhos.
 */
export function ProvedorTemaSite({
  tema = "claro",
  children,
}: {
  tema?: "claro" | "escuro"
  children: React.ReactNode
}) {
  return (
    <div
      className={tema === "escuro" ? "dark" : "light"}
      style={{ colorScheme: tema === "escuro" ? "dark" : "light" }}
    >
      {children}
    </div>
  )
}

// Manter export antigo para compatibilidade
export function ProvedorTemaClaro({ children }: { children: React.ReactNode }) {
  return <ProvedorTemaSite tema="claro">{children}</ProvedorTemaSite>
}
