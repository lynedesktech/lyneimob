-- Migration 047: Tira as credenciais do alcance do login do usuario (SEC-07)
--
-- PROBLEMA
-- As policies de leitura de `organizacoes` e `config_whatsapp` (migration 019)
-- liberam a LINHA INTEIRA pra qualquer membro da organizacao, sem restricao de
-- coluna nem de cargo. E essas linhas guardam credenciais:
--
--   organizacoes.whatsapp_token
--   organizacoes.stripe_customer_id / stripe_subscription_id
--   organizacoes.configuracoes_integracoes  (o comentario da migration 009 diz
--       que guarda chaves de Stripe, OpenAI, Uazapi e Upstash, e que seriam
--       "acessiveis apenas via Server Actions" — mas nao eram)
--   organizacoes.webhook_secret             (migration 046)
--   config_whatsapp.uazapi_token
--
-- Um corretor consultava a API REST do banco com o proprio token de login e
-- levava essas chaves embora.
--
-- SOLUCAO
-- RLS age por LINHA; a protecao correta aqui e permissao de COLUNA.
--
-- ATENCAO AO DETALHE QUE INVALIDA A VERSAO INGENUA DESTA MIGRATION:
-- no PostgreSQL, `REVOKE SELECT (coluna)` NAO anula um `GRANT SELECT` dado na
-- tabela inteira — e o Supabase concede SELECT na tabela toda pros papeis
-- `anon` e `authenticated` por padrao. Revogar coluna por coluna seria um
-- no-op silencioso: a migration "passaria" e o vazamento continuaria.
--
-- O jeito certo e o daqui: revogar o SELECT da TABELA e reconceder, coluna a
-- coluna, apenas as que nao sao secretas.
--
-- O papel `service_role` (cliente admin do app e agente Python) nao e tocado —
-- continua lendo tudo, como precisa.
--
-- MANUTENCAO
-- Coluna nova nessas tabelas nasce invisivel pro app ate ser concedida aqui
-- (numa migration nova) e adicionada em src/lib/supabase/colunas-seguras.ts.
--
-- ORDEM DE DEPLOY
-- Subir o app ANTES de aplicar esta migration: os quatro pontos que faziam
-- select("*") ja foram trocados por lista explicita de colunas
--   src/hooks/use-organizacao.ts, src/hooks/use-config-whatsapp.ts,
--   src/lib/supabase/queries.ts, src/actions/whatsapp.ts
-- e as Server Actions que precisam das credenciais passaram a usar a conexao
-- administrativa, sempre filtrando por organizacao_id
--   src/actions/instancia-whatsapp.ts, src/actions/configuracoes-integracoes.ts
-- Aplicar a migration com o codigo antigo no ar quebra essas telas.

-- ============================================================
-- organizacoes
-- ============================================================

REVOKE SELECT ON public.organizacoes FROM authenticated;
REVOKE SELECT ON public.organizacoes FROM anon;

-- Reconcede tudo, menos: whatsapp_token, stripe_customer_id,
-- stripe_subscription_id, configuracoes_integracoes e webhook_secret.
GRANT SELECT (
  id,
  nome,
  slug,
  logo_url,
  telefone,
  email,
  endereco,
  creci,
  plano,
  plano_status,
  limites,
  configuracoes_site,
  configuracoes_ia,
  config_distribuicao,
  trial_fim_em,
  whatsapp_numero,
  created_at,
  updated_at
) ON public.organizacoes TO authenticated;

GRANT SELECT (
  id,
  nome,
  slug,
  logo_url,
  telefone,
  email,
  endereco,
  creci,
  plano,
  plano_status,
  limites,
  configuracoes_site,
  configuracoes_ia,
  config_distribuicao,
  trial_fim_em,
  whatsapp_numero,
  created_at,
  updated_at
) ON public.organizacoes TO anon;

-- ============================================================
-- config_whatsapp
-- ============================================================

REVOKE SELECT ON public.config_whatsapp FROM authenticated;
REVOKE SELECT ON public.config_whatsapp FROM anon;

-- Reconcede tudo, menos uazapi_token.
GRANT SELECT (
  id,
  organizacao_id,
  uazapi_url,
  instance_id,
  numero_whatsapp,
  ativo,
  nome_agente,
  prompt_personalizado,
  horario_atendimento,
  mensagem_fora_horario,
  corretor_padrao_id,
  criado_em,
  atualizado_em
) ON public.config_whatsapp TO authenticated;

GRANT SELECT (
  id,
  organizacao_id,
  uazapi_url,
  instance_id,
  numero_whatsapp,
  ativo,
  nome_agente,
  prompt_personalizado,
  horario_atendimento,
  mensagem_fora_horario,
  corretor_padrao_id,
  criado_em,
  atualizado_em
) ON public.config_whatsapp TO anon;
