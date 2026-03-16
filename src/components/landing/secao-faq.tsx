"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const perguntas = [
  {
    pergunta: "Preciso de cartão de crédito para começar?",
    resposta:
      "Não! O período de teste de 14 dias é completamente grátis e não exige cartão de crédito. Você só informa os dados de pagamento quando decidir assinar um plano.",
  },
  {
    pergunta: "Quantos imóveis posso cadastrar?",
    resposta:
      "Depende do seu plano. No CRM + IA, você pode cadastrar até 300 imóveis. No CRM + IA + SDR, o limite sobe para 1.000 imóveis. Durante o trial, o limite é de 50 imóveis.",
  },
  {
    pergunta: "O que é o Agente SDR por WhatsApp?",
    resposta:
      "É um agente de inteligência artificial que responde automaticamente os leads que chegam pelo WhatsApp. Ele qualifica o cliente, apresenta imóveis compatíveis e pode até agendar visitas — tudo 24 horas por dia, 7 dias por semana.",
  },
  {
    pergunta: "Posso cancelar a qualquer momento?",
    resposta:
      "Sim, sem multa e sem burocracia. Você pode cancelar sua assinatura a qualquer momento diretamente no painel de gerenciamento. Seu acesso continua até o fim do período já pago.",
  },
  {
    pergunta: "Como funciona a IA nos módulos?",
    resposta:
      "A IA está presente em todo o sistema: gera descrições profissionais para imóveis, analisa o perfil de clientes para sugerir matches, recomenda próximas ações em negócios e cria resumos semanais da sua operação. Tudo automático.",
  },
  {
    pergunta: "Tem contrato de fidelidade?",
    resposta:
      "Não. Todos os planos são sem fidelidade. Nos planos trimestral e anual, você tem desconto por escolher um período maior, mas pode cancelar antes — seu acesso segue até o fim do período contratado.",
  },
]

export function SecaoFaq() {
  const [aberta, setAberta] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-muted/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header da seção */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest text-[#3b82f6] uppercase">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Perguntas frequentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tudo que você precisa saber antes de começar.
          </p>
        </div>

        {/* Accordion */}
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
          {perguntas.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setAberta(aberta === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/50"
              >
                <span className="text-sm font-medium text-foreground sm:text-base">
                  {item.pergunta}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    aberta === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-200 ${
                  aberta === i
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {item.resposta}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
