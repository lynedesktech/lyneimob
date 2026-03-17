-- ============================================================
-- Migration 023: Etapa "Pré-atendimento IA" no pipeline
-- Nova etapa obrigatória que precede todas as outras no funil
-- Criada automaticamente para todas as organizações
-- ============================================================

-- 1. Atualizar CHECK constraint para incluir o novo tipo
ALTER TABLE public.pipeline_etapas
  DROP CONSTRAINT IF EXISTS pipeline_etapas_tipo_check;

ALTER TABLE public.pipeline_etapas
  ADD CONSTRAINT pipeline_etapas_tipo_check
    CHECK (tipo IN ('normal', 'ganho', 'perdido', 'pre_atendimento_ia'));

-- 2. Deslocar as etapas existentes para abrir espaço na posição 0
-- Usamos dois passos para evitar conflito na constraint UNIQUE (organizacao_id, ordem):
-- Passo A: adicionar 1000 a todas as ordens (sem conflito)
UPDATE public.pipeline_etapas SET ordem = ordem + 1000;
-- Passo B: subtrair 999 (resultado final: ordem original + 1)
UPDATE public.pipeline_etapas SET ordem = ordem - 999;

-- 3. Inserir etapa "Pré-atendimento IA" na posição 0 para todas as orgs existentes
INSERT INTO public.pipeline_etapas (organizacao_id, nome, cor, icone, ordem, tipo)
SELECT id, 'Pré-atendimento IA', '#6366f1', 'bot', 0, 'pre_atendimento_ia'
FROM public.organizacoes;

-- 4. Atualizar função criar_etapas_padrao para incluir a nova etapa
CREATE OR REPLACE FUNCTION public.criar_etapas_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pipeline_etapas (organizacao_id, nome, cor, icone, ordem, tipo) VALUES
    (NEW.id, 'Pré-atendimento IA', '#6366f1', 'bot',            0, 'pre_atendimento_ia'),
    (NEW.id, 'Novo Lead',          '#3b82f6', 'user-plus',      1, 'normal'),
    (NEW.id, 'Contato Feito',      '#8b5cf6', 'phone',          2, 'normal'),
    (NEW.id, 'Visita Agendada',    '#f59e0b', 'calendar',       3, 'normal'),
    (NEW.id, 'Proposta Enviada',   '#f97316', 'file-text',      4, 'normal'),
    (NEW.id, 'Em Negociação',      '#ef4444', 'message-circle', 5, 'normal'),
    (NEW.id, 'Ganho',              '#22c55e', 'check-circle',   6, 'ganho'),
    (NEW.id, 'Perdido',            '#6b7280', 'x-circle',       7, 'perdido');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
