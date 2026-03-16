-- ============================================================
-- Migration 015: Onboarding — campos de progresso do tour e checklist
-- ============================================================

-- Adiciona campos na tabela usuarios para rastrear onboarding
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS onboarding_completado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_etapas jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Comentários
COMMENT ON COLUMN usuarios.onboarding_completado IS 'Se o tour de boas-vindas já foi exibido e concluído';
COMMENT ON COLUMN usuarios.onboarding_etapas IS 'Progresso do checklist de primeiros passos (ex: {"imovel": true, "cliente": true})';
