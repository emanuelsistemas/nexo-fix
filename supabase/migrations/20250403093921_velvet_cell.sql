/*
  # Correção final do status das issues

  Esta é a migração definitiva para corrigir o enum issue_status
  e implementar o sistema Kanban com três estados.

  1. Mudanças
    - Corrige o enum issue_status para ter os três estados necessários
    - Preserva todos os dados existentes
    - Mantém as relações e constraints
*/

DO $$ 
BEGIN
  -- Verifica se precisamos fazer a alteração
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'issue_status' 
    AND typarray <> 0
  ) THEN
    -- Cria o novo enum se não existir
    CREATE TYPE issue_status AS ENUM ('pending', 'in_progress', 'completed');
  ELSE
    -- Altera o enum existente se necessário
    ALTER TYPE issue_status ADD VALUE IF NOT EXISTS 'in_progress' BEFORE 'completed';
  END IF;
END $$;

-- Garante que a tabela issues existe com a estrutura correta
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  module text NOT NULL,
  description text NOT NULL,
  priority issue_priority NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mantém RLS desabilitado conforme solicitado
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;