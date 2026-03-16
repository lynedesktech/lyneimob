-- ============================================================
-- Migration 018: Adicionar sugestao_ia_resumo aos negócios
-- Campo curto para exibir a ação sugerida no Kanban card
-- ============================================================

ALTER TABLE public.negocios
  ADD COLUMN sugestao_ia_resumo text;
