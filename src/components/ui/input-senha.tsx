"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"

interface InputSenhaProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {}

export function InputSenha(props: InputSenhaProps) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="relative">
      <Input {...props} type={visivel ? "text" : "password"} />
      <button
        type="button"
        onClick={() => setVisivel(!visivel)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
        aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
      >
        {visivel ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
