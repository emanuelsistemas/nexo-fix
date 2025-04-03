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
CREATE TYPE issue_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE issue_status AS ENUM ('pending', 'completed');

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

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Usuários podem ver suas próprias issues" ON issues;
DROP POLICY IF EXISTS "Usuários podem criar novas issues" ON issues;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias issues" ON issues;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias issues" ON issues;