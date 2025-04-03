/*
  # Criação da tabela de problemas (issues)

  1. Novas Tabelas
    - `issues`
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência ao usuário)
      - `module` (texto, módulo do sistema)
      - `description` (texto, descrição do problema)
      - `priority` (enum, prioridade do problema)
      - `status` (enum, status do problema)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Observação
    - Tabela criada sem RLS para acesso público
*/

-- Criar tipos enum
DO $$ BEGIN
  CREATE TYPE issue_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM ('pending', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de issues
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  module text NOT NULL,
  description text NOT NULL,
  priority issue_priority NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Remover RLS se já existir
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o updated_at
DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();