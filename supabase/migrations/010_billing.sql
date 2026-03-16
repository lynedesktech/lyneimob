-- ============================================================
-- Migration 010: Billing — campo trial_fim_em + tabela eventos_billing
-- ============================================================

-- ============================================================
-- 1. Adicionar campo trial_fim_em na tabela organizacoes
-- ============================================================
ALTER TABLE public.organizacoes
  ADD COLUMN IF NOT EXISTS trial_fim_em timestamptz;

-- Setar trial_fim_em para organizacoes existentes (14 dias a partir de agora)
UPDATE public.organizacoes
SET trial_fim_em = now() + interval '14 days'
WHERE plano = 'trial' AND trial_fim_em IS NULL;

-- Adicionar coluna configuracoes_integracoes se não existir (pode já existir de migration anterior)
-- ALTER TABLE public.organizacoes ADD COLUMN IF NOT EXISTS configuracoes_integracoes jsonb DEFAULT '{}'::jsonb;

-- ============================================================
-- 2. Atualizar limites default para valores de trial
-- ============================================================
ALTER TABLE public.organizacoes
  ALTER COLUMN limites SET DEFAULT '{"max_corretores": 2, "max_imoveis": 50, "max_conversas_ia_mes": 30}'::jsonb;

-- ============================================================
-- 3. Atualizar trigger de criação de organização para setar trial_fim_em
-- ============================================================
CREATE OR REPLACE FUNCTION public.criar_usuario_e_organizacao()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nova_org_id uuid;
  slug_gerado text;
  nome_org text;
BEGIN
  -- Pegar nome da organizacao do metadata (ou usar padrao)
  nome_org := coalesce(NEW.raw_user_meta_data->>'nome_organizacao', 'Minha Imobiliária');

  -- Gerar slug: nome em minusculo, sem acentos, com hifens + 8 chars do UUID
  slug_gerado := lower(regexp_replace(
    translate(
      nome_org,
      'áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ',
      'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'
    ),
    '[^a-z0-9]+', '-', 'g'
  ));
  -- Remover hifens no inicio e fim
  slug_gerado := trim(both '-' from slug_gerado);
  -- Adicionar sufixo unico
  slug_gerado := slug_gerado || '-' || substring(NEW.id::text from 1 for 8);

  -- Criar organizacao com trial de 14 dias
  INSERT INTO public.organizacoes (nome, slug, trial_fim_em)
  VALUES (nome_org, slug_gerado, now() + interval '14 days')
  RETURNING id INTO nova_org_id;

  -- Criar usuario vinculado a organizacao
  INSERT INTO public.usuarios (id, organizacao_id, nome, email, cargo)
  VALUES (
    NEW.id,
    nova_org_id,
    coalesce(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Tabela de eventos de billing (auditoria)
-- ============================================================
CREATE TABLE public.eventos_billing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  tipo_evento text NOT NULL,
  stripe_event_id text UNIQUE,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_eventos_billing_org ON public.eventos_billing(organizacao_id);
CREATE INDEX idx_eventos_billing_stripe ON public.eventos_billing(stripe_event_id);

-- ============================================================
-- 5. RLS para eventos_billing
-- ============================================================
ALTER TABLE public.eventos_billing ENABLE ROW LEVEL SECURITY;

-- Admins podem ver eventos da própria organização
CREATE POLICY "admin_ve_eventos_billing" ON public.eventos_billing
  FOR SELECT USING (
    organizacao_id = (SELECT organizacao_id FROM public.usuarios WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND cargo = 'admin'
    )
  );
