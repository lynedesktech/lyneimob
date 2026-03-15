-- ============================================================
-- Migration 004: Tabelas pipeline_etapas + negocios
-- Modulo de pipeline de vendas com etapas customizaveis e RLS
-- ============================================================

-- ============================================================
-- 1. TABELA PIPELINE_ETAPAS
-- Etapas do funil de vendas, customizaveis por organizacao
-- ============================================================
CREATE TABLE public.pipeline_etapas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,

  -- Identificacao
  nome text NOT NULL,
  cor text DEFAULT '#6b7280',
  icone text DEFAULT 'circle',

  -- Posicao no funil (drag-and-drop)
  ordem integer NOT NULL DEFAULT 0,

  -- Tipo da etapa (controla comportamento especial)
  tipo text DEFAULT 'normal' CHECK (tipo IN ('normal', 'ganho', 'perdido')),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Nome unico por organizacao
ALTER TABLE public.pipeline_etapas
  ADD CONSTRAINT uq_pipeline_etapa_nome_org UNIQUE (organizacao_id, nome);

-- Ordem unica por organizacao
ALTER TABLE public.pipeline_etapas
  ADD CONSTRAINT uq_pipeline_etapa_ordem_org UNIQUE (organizacao_id, ordem);

-- Trigger updated_at
CREATE TRIGGER trigger_pipeline_etapas_updated_at
  BEFORE UPDATE ON public.pipeline_etapas
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================================
-- 2. TABELA NEGOCIOS
-- Deals vinculados a cliente + imovel + etapa do pipeline
-- ============================================================
CREATE TABLE public.negocios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  corretor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Vinculacoes
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,
  etapa_id uuid NOT NULL REFERENCES public.pipeline_etapas(id) ON DELETE RESTRICT,

  -- Dados do negocio
  titulo text NOT NULL,
  valor numeric(15,2),
  tipo text NOT NULL CHECK (tipo IN ('venda', 'aluguel')),
  status text DEFAULT 'aberto' CHECK (status IN ('aberto', 'ganho', 'perdido')),

  -- Previsao e datas
  previsao_fechamento date,
  data_ganho timestamptz,
  data_perda timestamptz,

  -- Motivo da perda (obrigatorio quando status = perdido)
  motivo_perda text,

  -- Posicao dentro da etapa (para ordenacao no kanban)
  posicao integer DEFAULT 0,

  -- Notas internas
  observacoes text,

  -- IA
  analise_ia text,
  sugestao_ia text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER trigger_negocios_updated_at
  BEFORE UPDATE ON public.negocios
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================================
-- 3. RLS — PIPELINE_ETAPAS
-- ============================================================
ALTER TABLE public.pipeline_etapas ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios da organizacao
CREATE POLICY "pipeline_etapas_select"
  ON public.pipeline_etapas
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: admins e gerentes
CREATE POLICY "pipeline_etapas_insert"
  ON public.pipeline_etapas
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- UPDATE: admins e gerentes
CREATE POLICY "pipeline_etapas_update"
  ON public.pipeline_etapas
  FOR UPDATE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- DELETE: apenas admins
CREATE POLICY "pipeline_etapas_delete"
  ON public.pipeline_etapas
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 4. RLS — NEGOCIOS
-- ============================================================
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios da organizacao
CREATE POLICY "negocios_select"
  ON public.negocios
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: qualquer usuario da organizacao
CREATE POLICY "negocios_insert"
  ON public.negocios
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- UPDATE: corretor dono ou admin/gerente
CREATE POLICY "negocios_update"
  ON public.negocios
  FOR UPDATE USING (
    corretor_id = auth.uid()
    OR organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- DELETE: apenas admins
CREATE POLICY "negocios_delete"
  ON public.negocios
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );

-- ============================================================
-- 5. INDICES
-- ============================================================

-- Pipeline etapas
CREATE INDEX idx_pipeline_etapas_org ON public.pipeline_etapas(organizacao_id);
CREATE INDEX idx_pipeline_etapas_ordem ON public.pipeline_etapas(organizacao_id, ordem);

-- Negocios
CREATE INDEX idx_negocios_org ON public.negocios(organizacao_id);
CREATE INDEX idx_negocios_etapa ON public.negocios(etapa_id);
CREATE INDEX idx_negocios_cliente ON public.negocios(cliente_id);
CREATE INDEX idx_negocios_imovel ON public.negocios(imovel_id);
CREATE INDEX idx_negocios_corretor ON public.negocios(corretor_id);
CREATE INDEX idx_negocios_status ON public.negocios(organizacao_id, status);
CREATE INDEX idx_negocios_valor ON public.negocios(organizacao_id, valor);
CREATE INDEX idx_negocios_posicao ON public.negocios(etapa_id, posicao);

-- ============================================================
-- 6. SEED — Etapas padrao para novas organizacoes
-- Funcao que cria as etapas padrao automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.criar_etapas_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pipeline_etapas (organizacao_id, nome, cor, icone, ordem, tipo) VALUES
    (NEW.id, 'Novo Lead',          '#3b82f6', 'user-plus',     0, 'normal'),
    (NEW.id, 'Contato Feito',      '#8b5cf6', 'phone',         1, 'normal'),
    (NEW.id, 'Visita Agendada',    '#f59e0b', 'calendar',      2, 'normal'),
    (NEW.id, 'Proposta Enviada',   '#f97316', 'file-text',     3, 'normal'),
    (NEW.id, 'Em Negociação',      '#ef4444', 'message-circle',4, 'normal'),
    (NEW.id, 'Ganho',              '#22c55e', 'check-circle',  5, 'ganho'),
    (NEW.id, 'Perdido',            '#6b7280', 'x-circle',      6, 'perdido');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: ao criar organizacao, cria etapas padrao
CREATE TRIGGER trigger_criar_etapas_padrao
  AFTER INSERT ON public.organizacoes
  FOR EACH ROW EXECUTE FUNCTION public.criar_etapas_padrao();

-- ============================================================
-- 7. SEED — Criar etapas para organizacoes ja existentes
-- (executar apenas uma vez, para orgs que ja existem no banco)
-- ============================================================
INSERT INTO public.pipeline_etapas (organizacao_id, nome, cor, icone, ordem, tipo)
SELECT o.id, etapa.nome, etapa.cor, etapa.icone, etapa.ordem, etapa.tipo
FROM public.organizacoes o
CROSS JOIN (VALUES
  ('Novo Lead',          '#3b82f6', 'user-plus',      0, 'normal'),
  ('Contato Feito',      '#8b5cf6', 'phone',          1, 'normal'),
  ('Visita Agendada',    '#f59e0b', 'calendar',       2, 'normal'),
  ('Proposta Enviada',   '#f97316', 'file-text',      3, 'normal'),
  ('Em Negociação',      '#ef4444', 'message-circle', 4, 'normal'),
  ('Ganho',              '#22c55e', 'check-circle',   5, 'ganho'),
  ('Perdido',            '#6b7280', 'x-circle',       6, 'perdido')
) AS etapa(nome, cor, icone, ordem, tipo)
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipeline_etapas pe
  WHERE pe.organizacao_id = o.id
);
