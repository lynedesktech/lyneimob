-- ============================================================
-- Migration 016: Resumos Semanais — tabela para resumos gerados por IA
-- ============================================================

-- ============================================================
-- 1. Tabela de resumos semanais
-- ============================================================
CREATE TABLE public.resumos_semanais (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  semana_inicio date NOT NULL,
  semana_fim date NOT NULL,
  metricas jsonb NOT NULL DEFAULT '{}'::jsonb,
  conteudo text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),

  -- Apenas 1 resumo por semana por organização
  CONSTRAINT uq_resumo_semanal_org UNIQUE (organizacao_id, semana_inicio)
);

CREATE INDEX idx_resumos_semanais_org ON public.resumos_semanais(organizacao_id);

COMMENT ON TABLE public.resumos_semanais IS 'Resumos semanais gerados por IA com métricas e análise';
COMMENT ON COLUMN public.resumos_semanais.semana_inicio IS 'Segunda-feira da semana do resumo';
COMMENT ON COLUMN public.resumos_semanais.semana_fim IS 'Domingo da semana do resumo';
COMMENT ON COLUMN public.resumos_semanais.metricas IS 'Dados brutos usados para gerar o resumo (negócios, clientes, imóveis, atividades)';
COMMENT ON COLUMN public.resumos_semanais.conteudo IS 'Texto do resumo gerado pela IA';

-- ============================================================
-- 2. RLS — membros da organização podem ler, inserir e deletar
-- ============================================================
ALTER TABLE public.resumos_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membro_le_resumos" ON public.resumos_semanais
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

CREATE POLICY "membro_insere_resumos" ON public.resumos_semanais
  FOR INSERT WITH CHECK (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );

CREATE POLICY "membro_deleta_resumos" ON public.resumos_semanais
  FOR DELETE USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
  );
