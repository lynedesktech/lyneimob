-- =============================================================
-- 041: Libera 'anuncio_meta' como origem de lead + tabela de
--      violacoes de qualidade da IA (historico mensuravel)
-- =============================================================

-- 1) origem_lead: o agente (Python/Railway e TS/Vercel) tenta salvar
--    'anuncio_meta' quando o lead vem de Click-to-WhatsApp Ad (Meta),
--    mas a constraint da migration 025 so aceita
--    ('whatsapp','portal','site','outro') e rejeita com erro 23514.
--    Consequencia: NENHUM lead de anuncio fica etiquetado no CRM.

DO $$
DECLARE
  nome_constraint text;
BEGIN
  SELECT conname INTO nome_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.conversas_whatsapp'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%origem_lead%';

  IF nome_constraint IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.conversas_whatsapp DROP CONSTRAINT %I',
      nome_constraint
    );
  END IF;
END $$;

ALTER TABLE public.conversas_whatsapp
  ADD CONSTRAINT conversas_whatsapp_origem_lead_check
  CHECK (origem_lead IN ('whatsapp', 'portal', 'site', 'outro', 'anuncio_meta'));

-- 2) Historico de violacoes de qualidade detectadas pelo analyzer do
--    agente. Hoje as violacoes viram so alerta no WhatsApp (com silencio
--    de 4h) — sem historico nao da pra medir se os ajustes de prompt
--    estao reduzindo os erros de verdade.

CREATE TABLE IF NOT EXISTS public.violacoes_qualidade_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  conversa_id uuid REFERENCES conversas_whatsapp(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  severidade text NOT NULL CHECK (severidade IN ('alta', 'media', 'baixa')),
  detalhe text,
  mensagem_agente text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violacoes_qualidade_ia_org_data
  ON violacoes_qualidade_ia(organizacao_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_violacoes_qualidade_ia_tipo
  ON violacoes_qualidade_ia(tipo);

-- Tabela interna (so o agente escreve, via service role que bypassa RLS).
-- RLS ligada sem policies = nenhum acesso via anon/authenticated.
ALTER TABLE public.violacoes_qualidade_ia ENABLE ROW LEVEL SECURITY;
