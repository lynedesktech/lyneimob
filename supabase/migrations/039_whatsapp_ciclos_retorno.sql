-- LYNEDES-103 Sprint 2: gestao de ciclos de retorno
-- Lead que volta a mandar mensagem (apos encaminhado/finalizado/arquivado)
-- abre um novo ciclo. O agente reconhece e cumprimenta diferente.

ALTER TABLE conversas_whatsapp
  ADD COLUMN IF NOT EXISTS ciclo_atual INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS eh_retorno BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN conversas_whatsapp.ciclo_atual IS
  'Numero do ciclo atual da conversa. Incrementa quando lead retorna apos encaminhado/finalizado/arquivado.';

COMMENT ON COLUMN conversas_whatsapp.eh_retorno IS
  'True quando o lead voltou a mandar mensagem apos um ciclo anterior ter sido encerrado. Reseta no proximo encerramento.';
