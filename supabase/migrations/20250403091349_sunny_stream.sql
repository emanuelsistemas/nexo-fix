/*
  # Correção do esquema da tabela issues

  1. Alterações
    - Remove e recria a constraint de chave estrangeira na tabela issues
    - Garante que a tabela issues tenha RLS habilitado
    - Recria as políticas de acesso

  2. Segurança
    - Configura políticas de RLS para usuários autenticados
*/

-- Remover constraint existente se houver
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_user_id_fkey;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow authenticated users to read all issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to update all issues" ON issues;
DROP POLICY IF EXISTS "Allow authenticated users to delete all issues" ON issues;

-- Adicionar nova constraint de chave estrangeira
ALTER TABLE issues
ADD CONSTRAINT issues_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Criar novas políticas
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