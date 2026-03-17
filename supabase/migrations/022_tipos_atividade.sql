-- ============================================================
-- Migration 021: Tabela tipos_atividade
-- Tipos de atividade customizáveis por organização
-- Remove CHECK constraint hardcoded em atividades.tipo
-- ============================================================

-- ============================================================
-- 1. REMOVER CONSTRAINT ÚNICA DE ORDEM EM PIPELINE_ETAPAS
-- (facilita reordenamento sem conflitos de constraint)
-- ============================================================
ALTER TABLE public.pipeline_etapas
  DROP CONSTRAINT IF EXISTS uq_pipeline_etapa_ordem_org;

-- ============================================================
-- 2. TABELA TIPOS_ATIVIDADE
-- ============================================================
CREATE TABLE public.tipos_atividade (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Identificação
  nome text NOT NULL,
  slug text NOT NULL,   -- valor gravado em atividades.tipo (ex: 'ligacao', 'visita')
  cor text DEFAULT '#6b7280',
  icone text DEFAULT 'activity',

  -- Ordenação
  ordem integer NOT NULL DEFAULT 0,

  -- Status
  ativo boolean DEFAULT true,

  -- Tipos de sistema não podem ser excluídos
  sistema boolean DEFAULT false,

  created_at timestamptz DEFAULT now()
);

-- Nome único por organização
ALTER TABLE public.tipos_atividade
  ADD CONSTRAINT uq_tipo_atividade_nome_org UNIQUE (organizacao_id, nome);

-- Slug único por organização
ALTER TABLE public.tipos_atividade
  ADD CONSTRAINT uq_tipo_atividade_slug_org UNIQUE (organizacao_id, slug);

-- ============================================================
-- 3. REMOVER CHECK CONSTRAINT HARDCODED EM ATIVIDADES.TIPO
-- ============================================================
ALTER TABLE public.atividades
  DROP CONSTRAINT IF EXISTS atividades_tipo_check;

-- ============================================================
-- 4. RLS — TIPOS_ATIVIDADE
-- ============================================================
ALTER TABLE public.tipos_atividade ENABLE ROW LEVEL SECURITY;

-- SELECT: todos da organização
CREATE POLICY "tipos_atividade_select"
  ON public.tipos_atividade
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: admins e gerentes
CREATE POLICY "tipos_atividade_insert"
  ON public.tipos_atividade
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- UPDATE: admins e gerentes
CREATE POLICY "tipos_atividade_update"
  ON public.tipos_atividade
  FOR UPDATE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- DELETE: apenas admins (somente tipos não-sistema)
CREATE POLICY "tipos_atividade_delete"
  ON public.tipos_atividade
  FOR DELETE USING (
    sistema = false
    AND organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 5. ÍNDICES
-- ============================================================
CREATE INDEX idx_tipos_atividade_org ON public.tipos_atividade(organizacao_id);
CREATE INDEX idx_tipos_atividade_org_ordem ON public.tipos_atividade(organizacao_id, ordem);
CREATE INDEX idx_tipos_atividade_slug ON public.tipos_atividade(organizacao_id, slug);

-- ============================================================
-- 6. FUNÇÃO SEED — Cria tipos padrão para nova organização
-- ============================================================
CREATE OR REPLACE FUNCTION public.criar_tipos_atividade_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tipos_atividade (organizacao_id, nome, slug, cor, icone, ordem, sistema) VALUES
    (NEW.id, 'Ligação',   'ligacao',   '#3b82f6', 'phone',          0, true),
    (NEW.id, 'E-mail',    'email',     '#8b5cf6', 'mail',           1, true),
    (NEW.id, 'Visita',    'visita',    '#22c55e', 'map-pin',        2, true),
    (NEW.id, 'Reunião',   'reuniao',   '#f59e0b', 'users',          3, true),
    (NEW.id, 'Follow-up', 'follow_up', '#06b6d4', 'message-circle', 4, true),
    (NEW.id, 'Proposta',  'proposta',  '#f97316', 'file-text',      5, true),
    (NEW.id, 'Outro',     'outro',     '#6b7280', 'more-horizontal', 6, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: ao criar organização, cria tipos padrão
CREATE TRIGGER trigger_criar_tipos_atividade_padrao
  AFTER INSERT ON public.organizacoes
  FOR EACH ROW EXECUTE FUNCTION public.criar_tipos_atividade_padrao();

-- ============================================================
-- 7. SEED — Criar tipos para organizações já existentes
-- ============================================================
INSERT INTO public.tipos_atividade (organizacao_id, nome, slug, cor, icone, ordem, sistema)
SELECT o.id, tipo.nome, tipo.slug, tipo.cor, tipo.icone, tipo.ordem, true
FROM public.organizacoes o
CROSS JOIN (VALUES
  ('Ligação',   'ligacao',   '#3b82f6', 'phone',           0),
  ('E-mail',    'email',     '#8b5cf6', 'mail',            1),
  ('Visita',    'visita',    '#22c55e', 'map-pin',         2),
  ('Reunião',   'reuniao',   '#f59e0b', 'users',           3),
  ('Follow-up', 'follow_up', '#06b6d4', 'message-circle',  4),
  ('Proposta',  'proposta',  '#f97316', 'file-text',       5),
  ('Outro',     'outro',     '#6b7280', 'more-horizontal', 6)
) AS tipo(nome, slug, cor, icone, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tipos_atividade ta
  WHERE ta.organizacao_id = o.id
);
