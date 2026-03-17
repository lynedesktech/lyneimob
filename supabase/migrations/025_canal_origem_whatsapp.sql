-- Migration 024: Adicionar campos de canal/origem à tabela conversas_whatsapp
-- Permite que a IA saiba de onde o lead veio (WhatsApp direto, portal, site)
-- e qual imóvel ele estava vendo antes de entrar em contato

ALTER TABLE conversas_whatsapp
  ADD COLUMN IF NOT EXISTS origem_lead text DEFAULT 'whatsapp'
    CHECK (origem_lead IN ('whatsapp', 'portal', 'site', 'outro')),
  ADD COLUMN IF NOT EXISTS imovel_interesse_id uuid REFERENCES imoveis(id) ON DELETE SET NULL;

-- Índice para facilitar buscas por origem
CREATE INDEX IF NOT EXISTS idx_conversas_whatsapp_origem_lead
  ON conversas_whatsapp(origem_lead);
