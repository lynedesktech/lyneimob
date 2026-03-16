-- ============================================================
-- Migration 009: Configurações de Integrações
-- Adiciona coluna JSONB para armazenar chaves de API
-- das integrações configuradas pelo dono da imobiliária
-- ============================================================

ALTER TABLE public.organizacoes
ADD COLUMN IF NOT EXISTS configuracoes_integracoes jsonb DEFAULT '{}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.organizacoes.configuracoes_integracoes IS
  'Chaves de API de integrações (Stripe, OpenAI, WhatsApp/Uazapi, Upstash Redis). Armazenadas como JSONB, acessíveis apenas via Server Actions.';
