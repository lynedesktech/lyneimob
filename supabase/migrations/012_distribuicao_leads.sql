-- ============================================================
-- Migration 012: Distribuição de Leads entre Corretores
-- Adiciona configuração de distribuição na tabela organizações
-- Modos: manual (padrão), roleta (round-robin), balanceamento (por carga)
-- ============================================================

-- Adicionar coluna de configuração de distribuição
ALTER TABLE public.organizacoes
ADD COLUMN IF NOT EXISTS config_distribuicao jsonb DEFAULT '{
  "modo": "manual",
  "corretores_participantes": [],
  "ultimo_corretor_index": 0
}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.organizacoes.config_distribuicao IS 'Configuração de distribuição de leads: modo (manual/roleta/balanceamento), corretores_participantes (IDs, vazio = todos ativos), ultimo_corretor_index (controle round-robin)';
