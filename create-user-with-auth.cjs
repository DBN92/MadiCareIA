const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserCreationWithAuth() {
  console.log('🧪 Testando criação de usuários com autenticação Supabase...\n');

  try {
    // 1. Criar usuário usando auth.signUp
    console.log('👤 1. Criando usuário via auth.signUp...');
    const testEmail = `teste-${Date.now()}@hospital.com`;
    const testPassword = 'teste123456';
    const testName = `Dr. Teste ${Date.now()}`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
          role: 'doctor'
        }
      }
    });

    if (authError) {
      console.log(`   ❌ Erro no signup: ${authError.message}`);
      return;
    }

    console.log('   ✅ Usuário criado via auth.signUp!');
    console.log(`   📧 Email: ${authData.user?.email}`);
    console.log(`   🆔 ID: ${authData.user?.id}`);
    console.log(`   📊 Metadata: ${JSON.stringify(authData.user?.user_metadata, null, 2)}`);

    // 2. Verificar se o profile foi criado automaticamente
    console.log('\n🔍 2. Verificando se profile foi criado...');
    
    // Aguardar um pouco para o trigger funcionar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    if (profileError) {
      console.log(`   ❌ Erro ao buscar profile: ${profileError.message}`);
      
      // Tentar criar profile manualmente
      console.log('   🔧 Tentando criar profile manualmente...');
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          full_name: testName,
          role: 'doctor'
        })
        .select()
        .single();

      if (manualError) {
        console.log(`   ❌ Erro ao criar profile manualmente: ${manualError.message}`);
      } else {
        console.log('   ✅ Profile criado manualmente!');
        console.log(`   📊 Profile: ${JSON.stringify(manualProfile, null, 2)}`);
      }
    } else {
      console.log('   ✅ Profile encontrado!');
      console.log(`   📊 Profile: ${JSON.stringify(profile, null, 2)}`);
    }

    // 3. Testar login com o usuário criado
    console.log('\n🔐 3. Testando login com o usuário criado...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log(`   ❌ Erro no login: ${loginError.message}`);
    } else {
      console.log('   ✅ Login realizado com sucesso!');
      console.log(`   📧 Email: ${loginData.user?.email}`);
      console.log(`   🆔 ID: ${loginData.user?.id}`);
    }

    // 4. Fazer logout
    console.log('\n🚪 4. Fazendo logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.log(`   ❌ Erro no logout: ${logoutError.message}`);
    } else {
      console.log('   ✅ Logout realizado com sucesso!');
    }

    // 5. Limpar dados de teste (opcional - comentado para não deletar)
    console.log('\n🗑️  5. Limpeza de dados de teste...');
    console.log('   ⚠️  Dados de teste mantidos para verificação manual');
    console.log(`   📧 Email de teste: ${testEmail}`);
    console.log(`   🔑 Senha de teste: ${testPassword}`);
    console.log(`   🆔 ID do usuário: ${authData.user?.id}`);

    /*
    // Descomente para deletar o usuário de teste
    if (authData.user?.id) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
      if (deleteError) {
        console.log(`   ❌ Erro ao deletar usuário: ${deleteError.message}`);
      } else {
        console.log('   ✅ Usuário de teste deletado');
      }
    }
    */

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }

  console.log('\n🏁 Teste de criação com autenticação concluído!');
}

// Executar o teste
testUserCreationWithAuth().catch(console.error);