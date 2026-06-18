// ============================================================
// Normalização de telefone para formato WhatsApp (DDI 55)
// Módulo PURO (sem imports de servidor) — pode ser usado tanto
// em Server Components quanto em componentes "use client".
// ============================================================

/**
 * Normaliza telefone para formato WhatsApp: apenas dígitos com DDI 55
 * Ex: "(11) 99999-9999" → "5511999999999"
 */
export function normalizarTelefoneWhatsApp(telefone: string): string {
  // Remove tudo que não é dígito
  let limpo = telefone.replace(/\D/g, "")

  // Remove zero à esquerda (0xx)
  if (limpo.startsWith("0")) {
    limpo = limpo.substring(1)
  }

  // Adiciona DDI 55 se não tem
  if (!limpo.startsWith("55")) {
    limpo = "55" + limpo
  }

  return limpo
}
