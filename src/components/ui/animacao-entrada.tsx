"use client"

import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimacaoEntrada({ children, className, delay }: Props) {
  return (
    <div
      className={cn("animate-fade-in-up", className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
