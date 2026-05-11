/**
 * Modo de produto: define se o LyneImob roda como SaaS multi-tenant
 * ou como produto unico (single-tenant) customizado pra Duna Real Estate.
 *
 * Quando MODO_PRODUTO_UNICO = true:
 * - Telas /admin/* sao bloqueadas (redirect pra /painel)
 * - Cadastro de novas contas eh bloqueado (/cadastro -> /login via middleware)
 * - Sidebar nao mostra menus de plataforma (super_admin/desenvolvedor/investidor)
 * - Pagina /financeiro (planos/billing Stripe) eh escondida
 * - Banner de trial nao aparece
 *
 * Pra reverter pra SaaS, basta trocar pra false que tudo volta ao normal.
 *
 * Decisao tomada em 04/05/2026 — pivot estrategico, ver
 * docs/relatorios/progresso.md
 */
export const MODO_PRODUTO_UNICO = true
