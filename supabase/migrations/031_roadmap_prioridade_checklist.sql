-- Adicionar prioridade e checklist às tarefas do roadmap
ALTER TABLE tarefas_roadmap
  ADD COLUMN IF NOT EXISTS prioridade TEXT NOT NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS checklist JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Índice para filtros por prioridade
CREATE INDEX IF NOT EXISTS idx_tarefas_roadmap_prioridade ON tarefas_roadmap (prioridade);
