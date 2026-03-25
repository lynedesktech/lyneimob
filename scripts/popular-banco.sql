-- =============================================================
-- SCRIPT: Popular banco de dados com dados de demonstração
-- Cria: 1 organização, 1 usuário admin, 15 imóveis, 20 leads
-- =============================================================

-- 1. CRIAR USUÁRIO NO AUTH (via admin API - será feito via curl)
-- O trigger criar_usuario_e_organizacao() cria org + usuario automaticamente

-- 2. APÓS o signup, buscar IDs criados e inserir imóveis + clientes

-- Este script assume que o signup já foi feito e os IDs são conhecidos
-- Usaremos IDs fixos para facilitar as referências

-- =====================
-- VARIÁVEIS (substituir após signup)
-- =====================
-- ORG_ID: será preenchido após signup
-- USER_ID: será preenchido após signup
