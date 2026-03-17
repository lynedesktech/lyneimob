"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type OpcaoCombobox = {
  value: string
  label: string
}

interface ComboboxCampoProps {
  opcoes: OpcaoCombobox[]
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  placeholderBusca?: string
  vazio?: string
  permitirVazio?: boolean
  labelVazio?: string
  disabled?: boolean
  className?: string
}

export function ComboboxCampo({
  opcoes,
  value: valueProp,
  onChange,
  placeholder = "Selecionar...",
  placeholderBusca = "Buscar...",
  vazio = "Nenhum resultado.",
  permitirVazio = false,
  labelVazio = "Nenhum",
  disabled,
  className,
}: ComboboxCampoProps) {
  const [aberto, setAberto] = React.useState(false)
  const value = valueProp ?? ""

  const selecionado = opcoes.find((opcao) => opcao.value === value)

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-input/20 px-3 py-2 text-xs shadow-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30",
          className
        )}
        aria-expanded={aberto}
        role="combobox"
      >
        <span className={cn(!selecionado && "text-muted-foreground")}>
          {selecionado ? selecionado.label : placeholder}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder={placeholderBusca} />
          <CommandList>
            <CommandEmpty>{vazio}</CommandEmpty>
            <CommandGroup>
              {permitirVazio && (
                <CommandItem
                  value=""
                  data-checked={value === ""}
                  onSelect={() => {
                    onChange("")
                    setAberto(false)
                  }}
                >
                  {labelVazio}
                  <Check
                    className={cn(
                      "ml-auto h-3.5 w-3.5",
                      value === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              )}
              {opcoes.map((opcao) => (
                <CommandItem
                  key={opcao.value}
                  value={opcao.label}
                  data-checked={value === opcao.value}
                  onSelect={() => {
                    onChange(value === opcao.value ? "" : opcao.value)
                    setAberto(false)
                  }}
                >
                  {opcao.label}
                  <Check
                    className={cn(
                      "ml-auto h-3.5 w-3.5",
                      value === opcao.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
