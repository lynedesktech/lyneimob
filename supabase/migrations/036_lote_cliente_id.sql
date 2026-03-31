-- Migration: Adicionar cliente_id na tabela lotes
-- Permite vincular um cliente da base ao lote quando reservado/vendido

ALTER TABLE public.lotes
  ADD COLUMN cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Índice para buscas por cliente
CREATE INDEX idx_lotes_cliente ON public.lotes(cliente_id) WHERE cliente_id IS NOT NULL;

-- RLS: a policy existente já cobre pois filtra por organizacao_id
