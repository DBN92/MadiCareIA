const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase - substitua pelos seus valores
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAndFixRLS() {
  console.log('🔍 Testando políticas RLS atuais...\n');

  try {
    // 1. Testar se conseguimos listar profiles (pode falhar devido ao RLS)
    console.log('1️⃣ Testando acesso à tabela profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('❌ Erro ao acessar profiles:', profilesError.message);
    } else {
      console.log('✅ Acesso à tabela profiles funcionando');
    }

    // 2. Executar script de limpeza
    console.log('\n2️⃣ Executando script de limpeza das políticas RLS...');
    
    const cleanupScript = `
      -- Remover TODAS as políticas existentes
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
      
      -- Remover funções auxiliares
      DROP FUNCTION IF EXISTS public.is_user_admin(UUID);
      DROP FUNCTION IF EXISTS public.is_admin(UUID);
      
      -- Garantir que RLS está habilitado
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    `;

    const { error: cleanupError } = await supabase.rpc('exec_sql', { sql: cleanupScript });
    
    if (cleanupError) {
      console.log('⚠️ Erro na limpeza (pode ser normal):', cleanupError.message);
    } else {
      console.log('✅ Limpeza das políticas concluída');
    }

    // 3. Executar script de correção
    console.log('\n3️⃣ Executando script de correção RLS...');
    
    const fixScript = `
      -- Criar função auxiliar sem recursão
      CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID DEFAULT auth.uid())
      RETURNS BOOLEAN AS $$
      DECLARE
        user_role TEXT;
      BEGIN
        SELECT role INTO user_role 
        FROM profiles 
        WHERE id = user_id;
        
        RETURN COALESCE(user_role = 'admin', false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Políticas RLS corrigidas
      CREATE POLICY "Users can view own profile, admins view all" ON profiles
        FOR SELECT USING (
          auth.uid() = id OR 
          public.is_user_admin(auth.uid()) OR
          current_setting('role') = 'service_role'
        );

      CREATE POLICY "Users can update own profile, admins update all" ON profiles
        FOR UPDATE USING (
          auth.uid() = id OR 
          public.is_user_admin(auth.uid()) OR
          current_setting('role') = 'service_role'
        );

      CREATE POLICY "Allow profile creation without recursion" ON profiles
        FOR INSERT WITH CHECK (
          auth.uid() = id OR 
          public.is_user_admin(auth.uid()) OR
          current_setting('role') = 'service_role'
        );

      CREATE POLICY "Only admins can delete profiles" ON profiles
        FOR DELETE USING (
          public.is_user_admin(auth.uid()) OR
          current_setting('role') = 'service_role'
        );

      -- Recriar função handle_new_user
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
    `;

    const { error: fixError } = await supabase.rpc('exec_sql', { sql: fixScript });
    
    if (fixError) {
      console.log('❌ Erro na correção:', fixError.message);
    } else {
      console.log('✅ Correção RLS aplicada com sucesso');
    }

    // 4. Testar novamente
    console.log('\n4️⃣ Testando acesso após correção...');
    const { data: newProfiles, error: newError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (newError) {
      console.log('❌ Ainda há erro:', newError.message);
    } else {
      console.log('✅ Acesso à tabela profiles funcionando após correção!');
    }

    // 5. Testar criação de usuário
    console.log('\n5️⃣ Testando criação de usuário...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      user_metadata: {
        full_name: 'Usuário Teste RLS',
        role: 'nurse'
      }
    });

    if (userError) {
      console.log('❌ Erro na criação de usuário:', userError.message);
    } else {
      console.log('✅ Usuário criado com sucesso!');
      console.log('📧 Email:', testEmail);
      console.log('🆔 ID:', newUser.user.id);
      
      // Limpar usuário de teste
      await supabase.auth.admin.deleteUser(newUser.user.id);
      console.log('🧹 Usuário de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

console.log('🚀 Iniciando correção automática do RLS...\n');
testAndFixRLS().then(() => {
  console.log('\n✅ Processo de correção concluído!');
}).catch(error => {
  console.error('\n❌ Erro no processo:', error.message);
});