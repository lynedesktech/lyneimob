"use client"

import { ThemeProvider } from "next-themes"

export function ProvedorTemaClaro({ children }: { children: React.ReactNode }) {
  return <ThemeProvider forcedTheme="light">{children}</ThemeProvider>
}
