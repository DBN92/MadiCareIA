#!/usr/bin/env node

/**
 * Teste simples de conexão com Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (produção)
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

console.log('🔗 Testando conexão com Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('📡 1. Testando conexão básica...');
    console.log(`   🌐 URL: ${supabaseUrl}`);
    console.log(`   🔑 Key: ${supabaseKey.substring(0, 20)}...`);

    // Teste 1: Verificar se a tabela existe
    console.log('\n📋 2. Verificando se a tabela profiles existe...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Erro ao acessar tabela profiles:');
      console.log('   📝 Mensagem:', error.message);
      console.log('   🔍 Código:', error.code);
      console.log('   💡 Detalhes:', error.details);
      console.log('   🔗 Hint:', error.hint);
      return;
    }

    console.log('   ✅ Tabela profiles acessível');

    // Teste 2: Tentar fazer SELECT simples
    console.log('\n👥 3. Testando SELECT na tabela profiles...');
    
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(5);

    if (selectError) {
      console.log('   ❌ Erro no SELECT:');
      console.log('   📝 Mensagem:', selectError.message);
      console.log('   🔍 Código:', selectError.code);
    } else {
      console.log('   ✅ SELECT bem-sucedido');
      console.log(`   📊 Registros encontrados: ${profiles?.length || 0}`);
      
      if (profiles && profiles.length > 0) {
        console.log('   👤 Primeiro usuário:', profiles[0]);
      }
    }

    // Teste 3: Tentar INSERT simples
    console.log('\n➕ 4. Testando INSERT na tabela profiles...');
    
    const testUser = {
      id: crypto.randomUUID(),
      full_name: 'Teste Conexão',
      role: 'nurse'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert([testUser])
      .select();

    if (insertError) {
      console.log('   ❌ Erro no INSERT:');
      console.log('   📝 Mensagem:', insertError.message);
      console.log('   🔍 Código:', insertError.code);
      console.log('   💡 Detalhes:', insertError.details);
      
      if (insertError.message.includes('row-level security')) {
        console.log('\n   🎯 PROBLEMA IDENTIFICADO: Políticas RLS restritivas');
        console.log('   📋 SOLUÇÃO: Execute o script SQL de correção');
      }
    } else {
      console.log('   ✅ INSERT bem-sucedido');
      console.log('   📊 Dados inseridos:', insertData);
      
      // Limpar dados de teste
      await supabase.from('profiles').delete().eq('id', testUser.id);
      console.log('   🧹 Dados de teste removidos');
    }

  } catch (error) {
    console.error('💥 Erro fatal:', error);
  }
}

testConnection()
  .then(() => {
    console.log('\n🏁 Teste de conexão concluído!');
  })
  .catch((error) => {
    console.error('💥 Erro na execução:', error);
  });