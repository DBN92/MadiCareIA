#!/usr/bin/env node

/**
 * Script para testar criação de usuários em produção
 * Execute após aplicar as correções de RLS
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (produção)
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductionUserCreation() {
  console.log('🧪 Testando criação de usuários em produção...\n');

  try {
    // 1. Testar criação via auth.signUp
    console.log('👤 1. Testando criação via auth.signUp...');
    const timestamp = Date.now();
    const testEmail = `teste-prod-${timestamp}@hospital.com`;
    const testPassword = 'teste123456';
    const testUser = {
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: `Dr. Teste Produção ${timestamp}`,
          role: 'doctor'
        }
      }
    };

    const { data: authData, error: authError } = await supabase.auth.signUp(testUser);
    
    if (authError) {
      console.log('   ❌ Erro na criação via auth:', authError.message);
      return;
    }

    console.log('   ✅ Usuário criado via auth.signUp!');
    console.log(`   📧 Email: ${testEmail}`);
    console.log(`   🆔 ID: ${authData.user?.id}`);

    // 2. Verificar se o profile foi criado automaticamente
    console.log('\n🔍 2. Verificando criação automática do profile...');
    
    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user?.id)
      .single();

    if (profileError) {
      console.log('   ❌ Erro ao verificar profile:', profileError.message);
    } else {
      console.log('   ✅ Profile criado automaticamente!');
      console.log('   📊 Profile:', JSON.stringify(profile, null, 2));
    }

    // 3. Testar criação direta na tabela profiles (simulando admin)
    console.log('\n👨‍💼 3. Testando criação direta como admin...');
    
    const directUser = {
      id: crypto.randomUUID(),
      full_name: `Admin Test User ${timestamp}`,
      role: 'nurse'
    };

    const { data: directProfile, error: directError } = await supabase
      .from('profiles')
      .insert([directUser])
      .select()
      .single();

    if (directError) {
      console.log('   ❌ Erro na criação direta:', directError.message);
      console.log('   💡 Isso é esperado se as políticas RLS ainda não foram atualizadas');
    } else {
      console.log('   ✅ Profile criado diretamente!');
      console.log('   📊 Profile:', JSON.stringify(directProfile, null, 2));
    }

    // 4. Contar usuários totais
    console.log('\n📊 4. Contando usuários totais...');
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('   ❌ Erro ao contar usuários:', countError.message);
    } else {
      console.log(`   📈 Total de usuários: ${count}`);
    }

    // 5. Limpeza (remover usuário de teste)
    console.log('\n🧹 5. Limpando dados de teste...');
    
    if (authData.user?.id) {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', authData.user.id);

      if (deleteError) {
        console.log('   ⚠️  Não foi possível remover o usuário de teste:', deleteError.message);
      } else {
        console.log('   ✅ Usuário de teste removido');
      }
    }

    console.log('\n📋 Resumo do teste:');
    console.log(`   📧 Email testado: ${testEmail}`);
    console.log(`   🔑 Senha testada: ${testPassword}`);
    console.log('   ✅ Criação via auth: OK');
    console.log('   ✅ Profile automático: ' + (profileError ? 'FALHOU' : 'OK'));
    console.log('   ✅ Criação direta: ' + (directError ? 'FALHOU' : 'OK'));

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testProductionUserCreation()
  .then(() => {
    console.log('\n🏁 Teste de produção concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });