-- ============================================================
-- Migration 017: Adicionar instance_id e tornar numero_whatsapp nullable
-- Necessário para o fluxo de criação de instância Uazapi
-- ============================================================

-- Adicionar coluna instance_id para identificar a instância na Uazapi
ALTER TABLE public.config_whatsapp
  ADD COLUMN instance_id text;

-- Tornar numero_whatsapp nullable (preenchido automaticamente após conexão)
ALTER TABLE public.config_whatsapp
  ALTER COLUMN numero_whatsapp DROP NOT NULL;

-- Índice para busca por instance_id (usado no webhook)
CREATE INDEX idx_config_whatsapp_instance ON public.config_whatsapp(instance_id)
  WHERE instance_id IS NOT NULL;
