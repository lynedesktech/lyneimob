"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
  /** Delay em segundos antes de iniciar a animação */
  delay?: number
  /** Direção de entrada: "up" (padrão), "left", "right" */
  direcao?: "up" | "left" | "right"
}

const variantesPorDirecao = {
  up: { y: 30, x: 0 },
  left: { x: -30, y: 0 },
  right: { x: 30, y: 0 },
}

export function AnimacaoScroll({
  children,
  className,
  delay = 0,
  direcao = "up",
}: Props) {
  const offset = variantesPorDirecao[direcao]

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
