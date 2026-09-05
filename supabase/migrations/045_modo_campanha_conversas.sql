-- Migration 045: Grava o modo campanha na conversa (BUG-03 e BUG-09)
--
-- PROBLEMA
-- O modo campanha Guaruja era redescoberto a cada mensagem, procurando a
-- palavra "guaruj" no historico recente. Isso trouxe tres defeitos:
--
--  1. A varredura incluia as mensagens ENVIADAS pelo proprio agente. Bastava
--     ele citar o Guaruja uma vez numa conversa comum pra se auto-detectar
--     dali em diante e travar no discurso agressivo da campanha.
--  2. O verificador de qualidade tambem lia a propria resposta em analise:
--     uma resposta que citasse Cumbuco indevidamente ativava o modo e se
--     isentava da checagem — o texto sob auditoria se autoeximia.
--  3. Cada consumidor usava uma janela diferente (agente 30 mensagens +
--     memoria, analyzer 15, follow-up 15), entao o modo "caia" sozinho em
--     conversa longa e gerava alerta falso.
--
-- SOLUCAO
-- Uma marca persistida na conversa. O agente grava assim que detecta a
-- campanha nas mensagens DO CLIENTE, e todo mundo (agente, analyzer e o cron
-- de follow-up) passa a ler essa marca em vez de redetectar por palavra-chave.

ALTER TABLE public.conversas_whatsapp
  ADD COLUMN IF NOT EXISTS modo_campanha text;

COMMENT ON COLUMN public.conversas_whatsapp.modo_campanha IS
  'Campanha ativa nesta conversa (ex: guaruja). Gravado pelo agente ao detectar a campanha nas mensagens do cliente; lido pelo agente, pelo analyzer de qualidade e pelo cron de follow-up.';

-- Conversas que ja estao em campanha continuam em campanha: marca as que tem
-- mencao ao Guaruja em mensagem RECEBIDA (do cliente), nunca em mensagem
-- enviada pelo agente — que e justamente a origem do falso positivo.
UPDATE public.conversas_whatsapp c
SET modo_campanha = 'guaruja'
WHERE c.modo_campanha IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.mensagens_whatsapp m
    WHERE m.conversa_id = c.id
      AND m.direcao = 'recebida'
      -- 'guaruj' sem acento ja casa com "Guaruja" e "Guarujá": o acento cai
      -- na letra seguinte, que nao entra na busca.
      AND m.conteudo ILIKE '%guaruj%'
  );

CREATE INDEX IF NOT EXISTS idx_conversas_whatsapp_modo_campanha
  ON public.conversas_whatsapp (modo_campanha)
  WHERE modo_campanha IS NOT NULL;
