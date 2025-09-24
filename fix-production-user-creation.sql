-- Script para corrigir criação de usuários em produção
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover política restritiva atual
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- 2. Criar nova política mais flexível para inserção
-- Permite inserção por usuários autenticados OU pelo service role
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    current_setting('role') = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- 3. Política alternativa para admins criarem usuários
-- Permite que admins criem profiles para outros usuários
CREATE POLICY "Admins can create profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) OR
    current_setting('role') = 'service_role'
  );

-- 4. Atualizar política de visualização para incluir admins
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 5. Atualizar política de atualização para incluir admins  
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 6. Política para deletar (apenas admins)
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) OR
    current_setting('role') = 'service_role'
  );

-- 7. Comentários sobre as mudanças
/*
MUDANÇAS IMPLEMENTADAS:

1. ✅ Política de inserção mais flexível
   - Permite inserção por usuários autenticados
   - Permite inserção pelo service role
   - Permite que admins criem usuários para outros

2. ✅ Políticas de visualização e atualização expandidas
   - Usuários podem ver/editar seus próprios profiles
   - Admins podem ver/editar todos os profiles

3. ✅ Política de deleção para admins
   - Apenas admins podem deletar profiles

PRÓXIMOS PASSOS:
1. Execute este script no Supabase Dashboard
2. Configure confirmação automática de email (opcional)
3. Teste criação de usuários via interface
*/