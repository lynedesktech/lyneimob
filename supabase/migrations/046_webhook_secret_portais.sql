-- Migration 046: Segredo por organizacao no webhook de portais (SEC-03)
--
-- PROBLEMA
-- A rota /api/webhooks/portais nao validava nada: nem assinatura, nem segredo.
-- A organizacao de destino vinha do proprio corpo da requisicao (org_slug,
-- org_id, empresa_id ou headers equivalentes) e o slug e publico, porque e o
-- endereco do site da imobiliaria.
--
-- Com isso qualquer pessoa na internet podia:
--   1. injetar leads falsos no CRM de qualquer imobiliaria; e
--   2. o mais grave — como a rota dispara enviarMensagemProativaPortal quando
--      o payload traz telefone, fazer o WhatsApp DA IMOBILIARIA enviar mensagem
--      pra um numero escolhido pelo atacante (spam a partir do numero da
--      vitima, com risco real de banimento do WhatsApp dela).
--
-- SOLUCAO
-- Um segredo por organizacao, exigido na chamada do webhook. A rota passa a
-- resolver a organizacao PELO SEGREDO, e nao pelo que veio escrito no corpo.
--
-- ATENCAO OPERACIONAL
-- Depois de aplicar esta migration, cada portal ja integrado precisa ser
-- reconfigurado com a URL nova (ela agora leva ?token=<segredo>). A URL pronta
-- aparece em Configuracoes -> Portais. Ate isso ser feito, o portal recebera
-- 401 e os leads dele nao entram.

ALTER TABLE public.organizacoes
  ADD COLUMN IF NOT EXISTS webhook_secret text;

-- Gera um segredo pra quem ainda nao tem. Dois UUIDs sem hifen = 64 chars.
UPDATE public.organizacoes
SET webhook_secret = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE webhook_secret IS NULL;

ALTER TABLE public.organizacoes
  ALTER COLUMN webhook_secret SET DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

ALTER TABLE public.organizacoes
  ALTER COLUMN webhook_secret SET NOT NULL;

-- Busca por segredo precisa ser rapida e o valor e unico por organizacao.
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizacoes_webhook_secret
  ON public.organizacoes (webhook_secret);

COMMENT ON COLUMN public.organizacoes.webhook_secret IS
  'Segredo exigido no webhook de portais (/api/webhooks/portais). Identifica a organizacao de destino: nunca resolver a organizacao pelo corpo da requisicao, que e controlado por quem chama.';
