-- Migration 029: Tabela de tarefas do roadmap para o painel Super Admin
-- Armazena todas as tarefas do projeto para visualização no dashboard

CREATE TABLE tarefas_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'a_fazer'
    CHECK (status IN ('a_fazer', 'fazendo', 'pronto', 'concluido', 'sugestao')),
  data_conclusao DATE,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para filtrar por status rapidamente
CREATE INDEX idx_tarefas_roadmap_status ON tarefas_roadmap (status);

-- RLS: apenas super_admin pode ler e escrever
ALTER TABLE tarefas_roadmap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_leitura" ON tarefas_roadmap
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND super_admin = true)
  );

CREATE POLICY "super_admin_escrita" ON tarefas_roadmap
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND super_admin = true)
  );

-- Tabela para armazenar a análise da IA (cache)
CREATE TABLE analise_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo TEXT NOT NULL,
  dados_resumo JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE analise_roadmap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_analise" ON analise_roadmap
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND super_admin = true)
  );
