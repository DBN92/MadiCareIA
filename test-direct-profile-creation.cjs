#!/usr/bin/env node

/**
 * Script para testar inserção direta na tabela profiles
 * Evita o limite de taxa de email do Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (produção)
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectProfileCreation() {
  console.log('🧪 Testando inserção direta na tabela profiles...\n');

  try {
    // 1. Verificar usuários existentes
    console.log('📊 1. Verificando usuários existentes...');
    const { count: initialCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('   ❌ Erro ao contar usuários:', countError.message);
      return;
    }

    console.log(`   📈 Usuários existentes: ${initialCount}`);

    // 2. Testar inserção direta (sem auth)
    console.log('\n👨‍💼 2. Testando inserção direta como admin...');
    
    const timestamp = Date.now();
    const testUser = {
      id: crypto.randomUUID(),
      full_name: `Teste Direto ${timestamp}`,
      role: 'nurse'
    };

    console.log(`   🆔 ID do teste: ${testUser.id}`);
    console.log(`   👤 Nome: ${testUser.full_name}`);
    console.log(`   🏥 Função: ${testUser.role}`);

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert([testUser])
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ Erro na inserção direta:', insertError.message);
      console.log('   🔍 Código do erro:', insertError.code);
      console.log('   💡 Detalhes:', insertError.details);
      
      if (insertError.message.includes('row-level security')) {
        console.log('\n   🚨 PROBLEMA CONFIRMADO: Políticas RLS muito restritivas');
        console.log('   📝 SOLUÇÃO: Execute o script fix-production-user-creation.sql no Supabase Dashboard');
      }
    } else {
      console.log('   ✅ Inserção direta bem-sucedida!');
      console.log('   📊 Dados inseridos:', JSON.stringify(insertData, null, 2));
    }

    // 3. Verificar se o usuário foi persistido
    console.log('\n🔍 3. Verificando se o usuário foi persistido...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single();

    if (verifyError) {
      if (verifyError.code === 'PGRST116') {
        console.log('   ❌ Usuário não foi persistido (não encontrado)');
      } else {
        console.log('   ❌ Erro na verificação:', verifyError.message);
      }
    } else {
      console.log('   ✅ Usuário persistido com sucesso!');
      console.log('   📊 Dados verificados:', JSON.stringify(verifyData, null, 2));
    }

    // 4. Contar usuários após teste
    console.log('\n📊 4. Contando usuários após teste...');
    const { count: finalCount, error: finalCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (finalCountError) {
      console.log('   ❌ Erro ao contar usuários finais:', finalCountError.message);
    } else {
      console.log(`   📈 Usuários após teste: ${finalCount}`);
      console.log(`   📊 Diferença: ${finalCount - initialCount}`);
    }

    // 5. Limpeza (tentar remover usuário de teste)
    console.log('\n🧹 5. Tentando limpar dados de teste...');
    
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testUser.id);

    if (deleteError) {
      console.log('   ⚠️  Não foi possível remover o usuário de teste:', deleteError.message);
      console.log('   💡 Isso pode indicar políticas RLS restritivas para DELETE');
    } else {
      console.log('   ✅ Usuário de teste removido com sucesso');
    }

    // 6. Resumo final
    console.log('\n📋 Resumo do teste:');
    console.log(`   🆔 ID testado: ${testUser.id}`);
    console.log(`   👤 Nome testado: ${testUser.full_name}`);
    console.log('   ✅ Inserção direta: ' + (insertError ? 'FALHOU' : 'OK'));
    console.log('   ✅ Persistência: ' + (verifyError ? 'FALHOU' : 'OK'));
    console.log('   ✅ Remoção: ' + (deleteError ? 'FALHOU' : 'OK'));

    if (insertError && insertError.message.includes('row-level security')) {
      console.log('\n🎯 PRÓXIMO PASSO:');
      console.log('   1. Acesse o Supabase Dashboard');
      console.log('   2. Vá para SQL Editor');
      console.log('   3. Execute o script fix-production-user-creation.sql');
      console.log('   4. Execute este teste novamente');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testDirectProfileCreation()
  .then(() => {
    console.log('\n🏁 Teste de inserção direta concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });