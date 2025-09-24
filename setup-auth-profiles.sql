-- Script para configurar autenticação e tabela profiles
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- 2. Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'doctor', 'nurse')) DEFAULT 'nurse',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Row Level Security) na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para a tabela profiles (sem recursão)
-- Política para permitir que usuários vejam seus próprios profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para permitir que usuários atualizem seus próprios profiles
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para permitir inserção de novos profiles (necessário para o trigger)
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política simplificada para admins (sem recursão)
-- Nota: Esta política será mais restritiva inicialmente para evitar recursão
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (current_setting('role') = 'service_role');

-- 5. Criar função para criar profile automaticamente
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

-- 6. Criar trigger para executar a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at na tabela profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Inserir profiles para usuários existentes (se houver)
INSERT INTO profiles (id, full_name, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  COALESCE(raw_user_meta_data->>'role', 'nurse') as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 10. Criar função auxiliar para verificar se usuário é admin (sem recursão)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Comentários sobre o funcionamento
/*
Este script configura:

1. Tabela profiles com referência à auth.users
2. Políticas RLS para segurança (sem recursão infinita)
3. Trigger automático para criar profile quando usuário é criado
4. Função para atualizar timestamp automaticamente
5. Migração de usuários existentes
6. Função auxiliar para verificar permissões de admin

Após executar este script:
- Novos usuários criados via auth.signUp terão profiles criados automaticamente
- Usuários podem ver/editar apenas seus próprios profiles
- A recursão infinita nas políticas foi resolvida
- A tabela profiles será atualizada automaticamente

IMPORTANTE: Execute este script completo no SQL Editor do Supabase Dashboard
*/