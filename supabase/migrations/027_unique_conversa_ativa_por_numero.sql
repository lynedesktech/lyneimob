-- Prevenir race condition: apenas 1 conversa ativa por numero por organizacao
-- Quando 5 webhooks chegam simultaneamente, apenas o primeiro INSERT consegue.
-- Os demais recebem erro 23505 e fazem SELECT para pegar a conversa existente.
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversas_whatsapp_numero_ativo
ON conversas_whatsapp (organizacao_id, numero_cliente)
WHERE status IN ('em_andamento', 'qualificado', 'encaminhado');
