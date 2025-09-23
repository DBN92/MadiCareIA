-- Script para configurar tabelas do sistema de demo
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de usuários demo
CREATE TABLE IF NOT EXISTS demo_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  demo_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_demo_users_email ON demo_users(email);
CREATE INDEX IF NOT EXISTS idx_demo_users_token ON demo_users(demo_token);
CREATE INDEX IF NOT EXISTS idx_demo_users_expires_at ON demo_users(expires_at);
CREATE INDEX IF NOT EXISTS idx_demo_users_active ON demo_users(is_active);

-- 3. Modificar tabela patients para incluir demo_user_id
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS demo_user_id UUID REFERENCES demo_users(id) ON DELETE CASCADE;

-- 4. Modificar tabela events para incluir demo_user_id
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS demo_user_id UUID REFERENCES demo_users(id) ON DELETE CASCADE;

-- 5. Criar função para limpar dados expirados
CREATE OR REPLACE FUNCTION cleanup_expired_demo_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Marcar usuários como inativos primeiro
  UPDATE demo_users 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  
  -- Deletar dados dos pacientes e eventos dos usuários expirados
  DELETE FROM events 
  WHERE demo_user_id IN (
    SELECT id FROM demo_users 
    WHERE expires_at < NOW() - INTERVAL '1 day'
  );
  
  DELETE FROM patients 
  WHERE demo_user_id IN (
    SELECT id FROM demo_users 
    WHERE expires_at < NOW() - INTERVAL '1 day'
  );
  
  -- Deletar usuários demo expirados (após 1 dia de expiração)
  DELETE FROM demo_users 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar função para verificar se token é válido
CREATE OR REPLACE FUNCTION is_demo_token_valid(token_input VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM demo_users 
    WHERE demo_token = token_input 
    AND expires_at > NOW() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para obter dados do usuário demo
CREATE OR REPLACE FUNCTION get_demo_user_by_token(token_input VARCHAR)
RETURNS TABLE(
  user_id UUID,
  email VARCHAR,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    du.id,
    du.email,
    du.expires_at,
    EXTRACT(DAY FROM (du.expires_at - NOW()))::INTEGER as days_remaining
  FROM demo_users du
  WHERE du.demo_token = token_input 
  AND du.expires_at > NOW() 
  AND du.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar políticas RLS (Row Level Security) para isolamento de dados

-- Habilitar RLS nas tabelas
ALTER TABLE demo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política para demo_users - usuários só podem ver seus próprios dados
CREATE POLICY "Demo users can view own data" ON demo_users
  FOR ALL USING (auth.uid()::text = demo_token OR auth.role() = 'service_role');

-- Política para patients - isolamento por demo_user_id
CREATE POLICY "Demo users can manage own patients" ON patients
  FOR ALL USING (
    demo_user_id IS NULL OR 
    demo_user_id IN (
      SELECT id FROM demo_users 
      WHERE demo_token = auth.uid()::text 
      AND expires_at > NOW() 
      AND is_active = true
    ) OR
    auth.role() = 'service_role'
  );

-- Política para events - isolamento por demo_user_id
CREATE POLICY "Demo users can manage own events" ON events
  FOR ALL USING (
    demo_user_id IS NULL OR 
    demo_user_id IN (
      SELECT id FROM demo_users 
      WHERE demo_token = auth.uid()::text 
      AND expires_at > NOW() 
      AND is_active = true
    ) OR
    auth.role() = 'service_role'
  );

-- 9. Criar trigger para limpeza automática (opcional - pode ser executado via cron)
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_demo()
RETURNS TRIGGER AS $$
BEGIN
  -- Executar limpeza quando um usuário faz login
  PERFORM cleanup_expired_demo_users();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE demo_users IS 'Tabela para usuários do sistema de demo com expiração de 7 dias';
COMMENT ON FUNCTION cleanup_expired_demo_users() IS 'Função para limpar usuários demo expirados e seus dados';
COMMENT ON FUNCTION is_demo_token_valid(VARCHAR) IS 'Verifica se um token demo ainda é válido';
COMMENT ON FUNCTION get_demo_user_by_token(VARCHAR) IS 'Retorna dados do usuário demo pelo token';

-- Inserir dados de exemplo (opcional)
-- INSERT INTO demo_users (email, password_hash, demo_token) 
-- VALUES ('demo@example.com', 'hashed_password', 'demo_token_123');

SELECT 'Tabelas e funções do sistema de demo criadas com sucesso!' as status;