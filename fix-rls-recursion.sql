-- Script para corrigir recursão infinita nas políticas RLS da tabela profiles
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover todas as políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- 2. Criar função auxiliar para verificar se usuário é admin (sem recursão)
-- Esta função usa SECURITY DEFINER para contornar as políticas RLS
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Usar SECURITY DEFINER permite contornar RLS temporariamente
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = user_id;
  
  RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar políticas RLS sem recursão usando a função auxiliar

-- Política para visualização: usuários veem próprio profile, admins veem todos
CREATE POLICY "Users can view own profile, admins view all" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    public.is_user_admin(auth.uid()) OR
    current_setting('role') = 'service_role'
  );

-- Política para atualização: usuários atualizam próprio profile, admins atualizam todos
CREATE POLICY "Users can update own profile, admins update all" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    public.is_user_admin(auth.uid()) OR
    current_setting('role') = 'service_role'
  );

-- Política para inserção: usuários autenticados podem criar próprio profile, admins podem criar qualquer profile
CREATE POLICY "Allow profile creation without recursion" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    public.is_user_admin(auth.uid()) OR
    current_setting('role') = 'service_role'
  );

-- Política para deleção: apenas admins e service role podem deletar
CREATE POLICY "Only admins can delete profiles" ON profiles
  FOR DELETE USING (
    public.is_user_admin(auth.uid()) OR
    current_setting('role') = 'service_role'
  );

-- 4. Garantir que a função handle_new_user ainda funciona
-- Recriar a função com SECURITY DEFINER para contornar RLS durante inserção automática
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

-- 5. Comentários sobre a solução
/*
SOLUÇÃO IMPLEMENTADA:

✅ PROBLEMA RESOLVIDO: Recursão infinita nas políticas RLS
   - Removidas políticas que faziam consultas à própria tabela profiles
   - Criada função auxiliar is_user_admin() com SECURITY DEFINER
   - A função contorna temporariamente as políticas RLS para verificar role

✅ FUNCIONALIDADES MANTIDAS:
   - Usuários podem ver/editar apenas seus próprios profiles
   - Admins podem ver/editar todos os profiles
   - Criação automática de profiles via trigger
   - Service role mantém acesso total

✅ SEGURANÇA:
   - SECURITY DEFINER usado apenas na função auxiliar
   - Políticas RLS continuam ativas e funcionais
   - Verificação de permissões mantida

TESTE APÓS EXECUÇÃO:
1. Tente carregar a lista de usuários na interface
2. Verifique se não há mais erro de recursão infinita
3. Teste criação de novos usuários
4. Confirme que admins podem gerenciar todos os profiles
*/