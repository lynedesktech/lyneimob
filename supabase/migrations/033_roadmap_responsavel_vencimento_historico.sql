-- Adicionar responsável e data de vencimento nas tarefas do roadmap
ALTER TABLE tarefas_roadmap
  ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- Tabela de histórico de mudanças nas tarefas
CREATE TABLE historico_tarefas_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID NOT NULL REFERENCES tarefas_roadmap(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_historico_tarefas_tarefa ON historico_tarefas_roadmap (tarefa_id, created_at DESC);

ALTER TABLE historico_tarefas_roadmap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_historico" ON historico_tarefas_roadmap
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND super_admin = true)
  );
