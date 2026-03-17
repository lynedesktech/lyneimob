-- Migration 022: Adiciona campo nome_agente à config_whatsapp
-- Permite definir um nome personalizado para o agente virtual (ex: "Ana Paula")
-- Se não configurado, o agente usa "Assistente [NomeOrg]" como fallback

ALTER TABLE config_whatsapp
ADD COLUMN IF NOT EXISTS nome_agente text;
