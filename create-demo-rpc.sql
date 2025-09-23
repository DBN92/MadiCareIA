-- Função RPC para criar usuário demo
-- Execute este script no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION create_demo_user(
  user_email VARCHAR,
  user_password_hash VARCHAR,
  user_demo_token VARCHAR
)
RETURNS JSON AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM demo_users WHERE email = user_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email já cadastrado'
    );
  END IF;
  
  -- Verificar se token já existe (improvável, mas por segurança)
  IF EXISTS (SELECT 1 FROM demo_users WHERE demo_token = user_demo_token) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token já existe, tente novamente'
    );
  END IF;
  
  -- Inserir novo usuário
  INSERT INTO demo_users (
    email,
    password_hash,
    demo_token,
    created_at,
    expires_at,
    is_active
  ) VALUES (
    user_email,
    user_password_hash,
    user_demo_token,
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  ) RETURNING id INTO new_user_id;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'demo_token', user_demo_token,
    'expires_at', (NOW() + INTERVAL '7 days')::text
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para fazer login demo
CREATE OR REPLACE FUNCTION login_demo_user(
  user_email VARCHAR,
  user_password_hash VARCHAR
)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  result JSON;
BEGIN
  -- Buscar usuário
  SELECT * INTO user_record
  FROM demo_users 
  WHERE email = user_email 
  AND password_hash = user_password_hash
  AND is_active = true
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Credenciais inválidas ou conta expirada'
    );
  END IF;
  
  -- Atualizar último login
  UPDATE demo_users 
  SET last_login = NOW() 
  WHERE id = user_record.id;
  
  -- Retornar dados do usuário
  RETURN json_build_object(
    'success', true,
    'user_id', user_record.id,
    'email', user_record.email,
    'demo_token', user_record.demo_token,
    'expires_at', user_record.expires_at::text,
    'days_remaining', EXTRACT(DAY FROM (user_record.expires_at - NOW()))
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar token demo
CREATE OR REPLACE FUNCTION validate_demo_token(
  token_input VARCHAR
)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Buscar usuário pelo token
  SELECT * INTO user_record
  FROM demo_users 
  WHERE demo_token = token_input
  AND is_active = true
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'valid', false,
      'error', 'Token inválido ou expirado'
    );
  END IF;
  
  -- Retornar dados do usuário
  RETURN json_build_object(
    'success', true,
    'valid', true,
    'user_id', user_record.id,
    'email', user_record.email,
    'expires_at', user_record.expires_at::text,
    'days_remaining', EXTRACT(DAY FROM (user_record.expires_at - NOW()))
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'valid', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Funções RPC para demo criadas com sucesso!' as status;