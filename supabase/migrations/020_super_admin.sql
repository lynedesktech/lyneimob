-- ============================================================
-- Migration 020: Super Admin (dono do SaaS)
-- Adiciona campo booleano para identificar o dono da plataforma
-- ============================================================

-- Adicionar coluna super_admin na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS super_admin boolean DEFAULT false;

-- Marcar o usuario dono do SaaS como super_admin
UPDATE usuarios SET super_admin = true WHERE email = 'superadmin@lyneimob.com';
