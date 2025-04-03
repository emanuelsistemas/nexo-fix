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

  2. Segurança
    - Habilitar RLS na tabela `issues`
    - Adicionar políticas para:
      - Usuários autenticados podem ler suas próprias issues
      - Usuários autenticados podem criar novas issues
      - Usuários autenticados podem atualizar suas próprias issues
      - Usuários autenticados podem deletar suas próprias issues
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

-- Habilitar RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver suas próprias issues"
  ON issues
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar novas issues"
  ON issues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias issues"
  ON issues
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias issues"
  ON issues
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);