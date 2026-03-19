-- ============================================================
-- Migration 035: Fix recursão infinita nas policies de perfil_plataforma
-- A migration 034 criou policies com subqueries na própria tabela usuarios,
-- causando recursão infinita. Solução: usar função SECURITY DEFINER
-- (mesmo padrão da migration 019 com organizacao_id_do_usuario).
-- ============================================================

-- 1. Criar função SECURITY DEFINER para buscar perfil_plataforma sem RLS
CREATE OR REPLACE FUNCTION public.perfil_plataforma_do_usuario()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT perfil_plataforma FROM public.usuarios WHERE id = auth.uid()
$$;

-- 2. Recriar policy de usuarios SEM recursão
DROP POLICY IF EXISTS "perfil_plataforma_ver_todos_usuarios" ON usuarios;
CREATE POLICY "perfil_plataforma_ver_todos_usuarios"
  ON usuarios FOR SELECT
  USING (
    public.perfil_plataforma_do_usuario() IN ('super_admin', 'desenvolvedor')
  );

-- 3. Recriar policy de organizacoes SEM recursão indireta
DROP POLICY IF EXISTS "perfil_plataforma_ver_todas_organizacoes" ON organizacoes;
CREATE POLICY "perfil_plataforma_ver_todas_organizacoes"
  ON organizacoes FOR SELECT
  USING (
    public.perfil_plataforma_do_usuario() IN ('super_admin', 'desenvolvedor', 'investidor')
  );
