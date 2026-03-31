-- Migration: Corrigir contatos salvos como "Contato WhatsApp"
-- Atualiza o nome usando o nome_cliente da conversa vinculada (pushName salvo lá)
-- ou formata o número de telefone como fallback

-- 1. Atualizar com nome_cliente da conversa (pushName) quando disponível
UPDATE clientes c
SET nome = cw.nome_cliente
FROM conversas_whatsapp cw
WHERE cw.cliente_id = c.id
  AND c.nome = 'Contato WhatsApp'
  AND cw.nome_cliente IS NOT NULL
  AND cw.nome_cliente != '';

-- 2. Para os que sobraram sem nome na conversa, formatar o número de telefone
-- Formato: "+55 DD NNNNN-NNNN"
UPDATE clientes
SET nome = '+' || SUBSTRING(telefone FROM 1 FOR 2) || ' ' ||
           SUBSTRING(telefone FROM 3 FOR 2) || ' ' ||
           SUBSTRING(telefone FROM 5 FOR 5) || '-' ||
           SUBSTRING(telefone FROM 10)
WHERE nome = 'Contato WhatsApp'
  AND telefone IS NOT NULL
  AND LENGTH(telefone) >= 12;

-- 3. Fallback final: se telefone curto ou ausente, usar "+{numero}"
UPDATE clientes
SET nome = '+' || COALESCE(telefone, whatsapp)
WHERE nome = 'Contato WhatsApp'
  AND COALESCE(telefone, whatsapp) IS NOT NULL;
