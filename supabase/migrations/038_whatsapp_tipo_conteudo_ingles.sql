-- LYNEDES-71: O agente Python no Railway envia tipo_conteudo em inglês (text, image, document, etc.)
-- O CHECK constraint original só aceitava português (texto, imagem, documento, etc.)
-- Isso fazia o INSERT falhar com erro 23514 e o agente nunca respondia

ALTER TABLE mensagens_whatsapp DROP CONSTRAINT IF EXISTS mensagens_whatsapp_tipo_conteudo_check;

ALTER TABLE mensagens_whatsapp ADD CONSTRAINT mensagens_whatsapp_tipo_conteudo_check
CHECK (tipo_conteudo = ANY (ARRAY[
  'texto', 'audio', 'imagem', 'documento', 'video', 'sticker', 'localizacao',
  'text', 'image', 'document', 'location', 'ptt'
]));
