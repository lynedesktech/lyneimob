// ============================================================
// Tipos do onboarding (tour de boas-vindas + checklist)
// ============================================================

/** Chaves possíveis das etapas do checklist */
export type ChaveEtapaOnboarding = "imovel" | "cliente" | "negocio" | "ia"

/** Progresso das etapas armazenado no banco (jsonb) */
export type EtapasOnboarding = Partial<Record<ChaveEtapaOnboarding, boolean>>

/** Estado completo do onboarding de um usuário */
export type ProgressoOnboarding = {
  onboarding_completado: boolean
  onboarding_etapas: EtapasOnboarding
}

/** Item individual do checklist exibido no dashboard */
export type ItemChecklist = {
  chave: ChaveEtapaOnboarding
  label: string
  descricao: string
  href: string
  icone: string
}
