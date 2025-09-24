-- Script para limpar todas as políticas RLS existentes da tabela profiles
-- Execute este script PRIMEIRO no SQL Editor do Supabase Dashboard

-- 1. Remover TODAS as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile, admins view all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile, admins update all" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation without recursion" ON profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;

-- 2. Remover função auxiliar se existir
DROP FUNCTION IF EXISTS public.is_user_admin(UUID);
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- 3. Verificar se RLS está habilitado (deve estar)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Comentário sobre próximos passos
/*
PRÓXIMOS PASSOS:

1. ✅ Execute este script primeiro para limpar todas as políticas
2. ⏭️ Depois execute o script fix-rls-recursion.sql completo
3. 🧪 Teste a criação de usuários

Este script garante que não haverá conflitos de políticas duplicadas.
*/

SELECT 'Políticas RLS limpas com sucesso! Agora execute o script fix-rls-recursion.sql' as status;