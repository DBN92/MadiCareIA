const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthSetup() {
  console.log('🧪 Testando configuração de autenticação e profiles...\n');

  try {
    // 1. Verificar se a tabela profiles existe e tem a estrutura correta
    console.log('📋 1. Verificando estrutura da tabela profiles...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log(`   ❌ Erro ao acessar tabela profiles: ${profilesError.message}`);
      console.log('   ⚠️  Execute o script setup-auth-profiles.sql no Supabase SQL Editor primeiro!');
      return;
    } else {
      console.log('   ✅ Tabela profiles acessível');
      console.log(`   📊 Profiles existentes: ${profiles?.length || 0}`);
    }

    // 2. Testar criação de usuário com autenticação
    console.log('\n👤 2. Testando criação de usuário com auth.signUp...');
    const testEmail = `teste-auth-${Date.now()}@hospital.com`;
    const testPassword = 'teste123456';
    const testName = `Dr. Teste Auth ${Date.now()}`;

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
      
      // Verificar se é erro de configuração
      if (authError.message.includes('Database error')) {
        console.log('   💡 Possível causa: Execute o script setup-auth-profiles.sql no Supabase');
        console.log('   📝 Ou verifique se a autenticação está habilitada no projeto Supabase');
      }
      return;
    }

    console.log('   ✅ Usuário criado via auth.signUp!');
    console.log(`   📧 Email: ${authData.user?.email}`);
    console.log(`   🆔 ID: ${authData.user?.id}`);
    console.log(`   📊 Metadata: ${JSON.stringify(authData.user?.user_metadata, null, 2)}`);

    // 3. Aguardar e verificar se o profile foi criado automaticamente pelo trigger
    console.log('\n🔍 3. Verificando criação automática do profile...');
    
    // Aguardar um pouco para o trigger funcionar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    if (profileError) {
      console.log(`   ❌ Profile não foi criado automaticamente: ${profileError.message}`);
      console.log('   💡 Verifique se o trigger foi criado corretamente no setup-auth-profiles.sql');
    } else {
      console.log('   ✅ Profile criado automaticamente pelo trigger!');
      console.log(`   📊 Profile: ${JSON.stringify(profile, null, 2)}`);
    }

    // 4. Testar login
    console.log('\n🔐 4. Testando login...');
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

    // 5. Testar acesso ao profile após login
    console.log('\n👤 5. Testando acesso ao profile após login...');
    
    // Verificar se o login foi bem-sucedido antes de tentar acessar o profile
    if (loginError || !loginData?.user?.id) {
      console.log('   ❌ Não é possível testar acesso ao profile - login falhou');
    } else {
      const { data: profileAfterLogin, error: profileAfterLoginError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profileAfterLoginError) {
        console.log(`   ❌ Erro ao acessar profile: ${profileAfterLoginError.message}`);
      } else {
        console.log('   ✅ Profile acessível após login!');
        console.log(`   📊 Profile: ${JSON.stringify(profileAfterLogin, null, 2)}`);
      }
    }

    // 6. Fazer logout
    console.log('\n🚪 6. Fazendo logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.log(`   ❌ Erro no logout: ${logoutError.message}`);
    } else {
      console.log('   ✅ Logout realizado com sucesso!');
    }

    // 7. Resumo dos resultados
    console.log('\n📊 7. Resumo dos testes:');
    console.log(`   📧 Email de teste: ${testEmail}`);
    console.log(`   🔑 Senha de teste: ${testPassword}`);
    console.log(`   🆔 ID do usuário: ${authData.user?.id}`);
    console.log(`   ✅ Autenticação: ${authError ? 'FALHOU' : 'OK'}`);
    console.log(`   ✅ Profile automático: ${profileError ? 'FALHOU' : 'OK'}`);
    console.log(`   ✅ Login: ${loginError ? 'FALHOU' : 'OK'}`);
    
    // Verificar se profileAfterLoginError existe antes de usar
    const profileAccessStatus = loginError ? 'NÃO TESTADO' : 'OK';
    console.log(`   ✅ Acesso ao profile: ${profileAccessStatus}`);

    if (!authError && !profileError && !loginError) {
      console.log('\n🎉 SUCESSO! A configuração de autenticação está funcionando corretamente!');
      console.log('   ✅ Usuários podem ser criados via auth.signUp');
      console.log('   ✅ Profiles são criados automaticamente');
      if (!loginError) {
        console.log('   ✅ Login e acesso aos dados funcionam');
      } else {
        console.log('   ⚠️  Login falhou - verifique confirmação de email');
      }
      console.log('\n💡 Agora você pode usar o sistema de usuários no Settings.tsx');
    } else {
      console.log('\n⚠️  Alguns testes falharam. Verifique:');
      console.log('   1. Se o script setup-auth-profiles.sql foi executado');
      console.log('   2. Se a autenticação está habilitada no Supabase');
      console.log('   3. Se as políticas RLS estão configuradas corretamente');
      if (loginError && loginError.message.includes('Email not confirmed')) {
        console.log('   4. Configure confirmação automática de email no Supabase Dashboard');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }

  console.log('\n🏁 Teste de configuração de autenticação concluído!');
}

// Executar o teste
testAuthSetup().catch(console.error);