"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<"div"> & {
  value?: number
  max?: number
}

export function Progress({ className, value = 0, max = 100, ...props }: ProgressProps) {
  const percentual = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${percentual}%` }}
      />
    </div>
  )
}
