/*
  # Correção do esquema do banco de dados

  1. Alterações
    - Recria a tabela systems se não existir
    - Adiciona constraint de chave estrangeira na tabela issues
    - Configura políticas de RLS corretamente

  2. Segurança
    - Habilita RLS nas tabelas
    - Configura políticas de acesso para usuários autenticados
*/

-- Criar tabela systems se não existir
CREATE TABLE IF NOT EXISTS systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela systems
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes da tabela systems
DROP POLICY IF EXISTS "Allow authenticated users to read systems" ON systems;

-- Criar nova política para systems
CREATE POLICY "Allow authenticated users to read systems"
  ON systems
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir sistemas padrão
INSERT INTO systems (name) VALUES
  ('nexo-pdv'),
  ('nexo-suporte'),
  ('pagina acesso remoto'),
  ('pagina ema-software'),
  ('nexo-drive')
ON CONFLICT (name) DO NOTHING;

-- Remover constraint existente da tabela issues
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_user_id_fkey;

-- Adicionar nova constraint de chave estrangeira
ALTER TABLE issues
ADD CONSTRAINT issues_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN issues.user_id IS 'References the auth.users table id';

-- Habilitar RLS na tabela issues
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes da tabela issues
DROP POLICY IF EXISTS "Allow authenticated users to read all issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to update all issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to delete all issues" ON issues;

-- Criar novas políticas para issues
CREATE POLICY "Allow authenticated users to read all issues"
  ON issues
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update all issues"
  ON issues
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete all issues"
  ON issues
  FOR DELETE
  TO authenticated
  USING (true);