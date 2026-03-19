-- ============================================================
-- Migration 034: perfil_plataforma
-- Adiciona campo perfil_plataforma na tabela usuarios
-- para suportar perfis globais (desenvolvedor, investidor)
-- separados do cargo organizacional (admin, gerente, corretor)
-- ============================================================

-- 1. Adicionar coluna perfil_plataforma em usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS perfil_plataforma TEXT
CHECK (perfil_plataforma IN ('super_admin', 'desenvolvedor', 'investidor'));

-- 2. Migrar dados: quem era super_admin booleano vira perfil_plataforma = 'super_admin'
UPDATE usuarios
SET perfil_plataforma = 'super_admin'
WHERE super_admin = true AND perfil_plataforma IS NULL;

-- 3. Trigger de sincronia: manter super_admin booleano sincronizado
--    durante periodo de transicao (compatibilidade retroativa)
CREATE OR REPLACE FUNCTION sincronizar_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.perfil_plataforma = 'super_admin' THEN
    NEW.super_admin := true;
  ELSE
    NEW.super_admin := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_super_admin ON usuarios;
CREATE TRIGGER trg_sincronizar_super_admin
  BEFORE INSERT OR UPDATE OF perfil_plataforma ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_super_admin();

-- 4. Adicionar coluna perfil_plataforma em convites
ALTER TABLE convites
ADD COLUMN IF NOT EXISTS perfil_plataforma TEXT
CHECK (perfil_plataforma IN ('super_admin', 'desenvolvedor', 'investidor'));

-- 5. RLS para usuarios com perfil_plataforma acessarem dados globais
CREATE POLICY "perfil_plataforma_ver_todas_organizacoes"
  ON organizacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND perfil_plataforma IN ('super_admin', 'desenvolvedor', 'investidor')
    )
  );

CREATE POLICY "perfil_plataforma_ver_todos_usuarios"
  ON usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil_plataforma IN ('super_admin', 'desenvolvedor')
    )
  );
