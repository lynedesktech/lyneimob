// ============================================================
// Dados de teste centralizados — Playwright E2E
// ============================================================

export const PERFIS = {
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@lyneimob.com',
    senha: process.env.SUPER_ADMIN_PASSWORD ?? 'LyneAdmin2026!',
    storageState: 'playwright/.auth/super-admin.json',
    cargo: 'super_admin' as const,
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@diagonal.com',
    senha: process.env.ADMIN_PASSWORD ?? 'Diagonal2026!',
    storageState: 'playwright/.auth/admin.json',
    cargo: 'admin' as const,
  },
  gerente: {
    email: process.env.GERENTE_EMAIL ?? 'gerente@diagonal.com',
    senha: process.env.GERENTE_PASSWORD ?? 'Diagonal2026!',
    storageState: 'playwright/.auth/gerente.json',
    cargo: 'gerente' as const,
  },
  corretor: {
    email: process.env.CORRETOR_EMAIL ?? 'corretor@diagonal.com',
    senha: process.env.CORRETOR_PASSWORD ?? 'Diagonal2026!',
    storageState: 'playwright/.auth/corretor.json',
    cargo: 'corretor' as const,
  },
} as const

export const ORG_SLUG = process.env.ORG_SLUG ?? 'diagonal-empreendimentos'

// Dados ficticios para criacao de registros (sufixo unico por perfil)
export function dadosCliente(perfil: string) {
  const ts = Date.now()
  return {
    nome: `Cliente Teste ${perfil} ${ts}`,
    email: `teste.${perfil}.${ts}@email.com`,
    telefone: '11999887766',
    tipo: 'comprador' as const,
  }
}

export function dadosImovel(perfil: string) {
  const ts = Date.now()
  return {
    codigo: `QA-${perfil.toUpperCase()}-${ts}`,
    titulo: `Imovel Teste ${perfil} ${ts}`,
    tipo: 'apartamento' as const,
    finalidade: 'venda' as const,
    cidade: 'Sao Paulo',
    estado: 'SP',
    preco_venda: '450000',
  }
}

export function dadosNegocio(perfil: string) {
  const ts = Date.now()
  return {
    titulo: `Negocio Teste ${perfil} ${ts}`,
    tipo: 'venda' as const,
  }
}

export function dadosAtividade(perfil: string) {
  const ts = Date.now()
  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  amanha.setHours(10, 0, 0, 0)
  return {
    titulo: `Atividade Teste ${perfil} ${ts}`,
    dataInicio: amanha.toISOString().slice(0, 16), // formato datetime-local
  }
}

export function dadosLoteamento(perfil: string) {
  const ts = Date.now()
  return {
    nome: `Loteamento Teste ${perfil} ${ts}`,
    cidade: 'Sao Paulo',
    estado: 'SP',
  }
}
