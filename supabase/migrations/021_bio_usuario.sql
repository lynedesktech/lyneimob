-- Adiciona campo bio (apresentação profissional) na tabela de usuários
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS bio text;
