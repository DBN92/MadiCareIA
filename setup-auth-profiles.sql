-- Script para configurar autenticação e tabela profiles
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'doctor', 'nurse')) DEFAULT 'nurse',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security) na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS para a tabela profiles
-- Política para permitir que usuários vejam e editem seus próprios profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para permitir inserção de novos profiles (necessário para o trigger)
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para admins gerenciarem todos os profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 4. Criar função para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'nurse')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger para executar a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para atualizar updated_at na tabela profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Inserir profiles para usuários existentes (se houver)
INSERT INTO profiles (id, full_name, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  COALESCE(raw_user_meta_data->>'role', 'nurse') as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 9. Comentários sobre o funcionamento
/*
Este script configura:

1. Tabela profiles com referência à auth.users
2. Políticas RLS para segurança
3. Trigger automático para criar profile quando usuário é criado
4. Função para atualizar timestamp automaticamente
5. Migração de usuários existentes

Após executar este script:
- Novos usuários criados via auth.signUp terão profiles criados automaticamente
- Usuários podem ver/editar apenas seus próprios profiles
- Admins podem gerenciar todos os profiles
- A tabela profiles será atualizada automaticamente
*/