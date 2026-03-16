-- ============================================================
-- Migration 005: Tabela atividades
-- Agenda de tarefas e compromissos dos corretores com RLS
-- ============================================================

-- ============================================================
-- 1. TABELA ATIVIDADES
-- Visitas, ligacoes, follow-ups, reunioes e outras tarefas
-- ============================================================
CREATE TABLE public.atividades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,

  -- Vinculacoes opcionais (atividade pode estar ligada a negocio, cliente ou imovel)
  negocio_id uuid REFERENCES public.negocios(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,

  -- Dados da atividade
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL CHECK (tipo IN ('ligacao', 'email', 'visita', 'reuniao', 'follow_up', 'proposta', 'outro')),
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida', 'cancelada')),
  prioridade text DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),

  -- Datas e horarios
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz,
  data_conclusao timestamptz,

  -- Lembrete por email
  lembrete timestamptz,

  -- Notas pos-atividade (o que aconteceu)
  notas_pos_atividade text,

  -- IA
  sugestao_ia text,
  briefing_ia text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER trigger_atividades_updated_at
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_updated_at();

-- ============================================================
-- 2. RLS — ATIVIDADES
-- ============================================================
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios da organizacao
CREATE POLICY "atividades_select"
  ON public.atividades
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: qualquer usuario da organizacao
CREATE POLICY "atividades_insert"
  ON public.atividades
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid()
    )
  );

-- UPDATE: usuario dono ou admin/gerente
CREATE POLICY "atividades_update"
  ON public.atividades
  FOR UPDATE USING (
    usuario_id = auth.uid()
    OR organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- DELETE: apenas admins e gerentes
CREATE POLICY "atividades_delete"
  ON public.atividades
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM public.usuarios
      WHERE id = auth.uid() AND cargo IN ('admin', 'gerente')
    )
  );

-- ============================================================
-- 3. INDICES
-- ============================================================
CREATE INDEX idx_atividades_org ON public.atividades(organizacao_id);
CREATE INDEX idx_atividades_usuario ON public.atividades(usuario_id);
CREATE INDEX idx_atividades_data ON public.atividades(organizacao_id, data_inicio DESC);
CREATE INDEX idx_atividades_status ON public.atividades(organizacao_id, status);
CREATE INDEX idx_atividades_tipo ON public.atividades(organizacao_id, tipo);
CREATE INDEX idx_atividades_negocio ON public.atividades(negocio_id);
CREATE INDEX idx_atividades_cliente ON public.atividades(cliente_id);
CREATE INDEX idx_atividades_imovel ON public.atividades(imovel_id);
CREATE INDEX idx_atividades_lembrete ON public.atividades(lembrete)
  WHERE lembrete IS NOT NULL AND status = 'pendente';
