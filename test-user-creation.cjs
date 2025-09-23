const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (usando as mesmas do .env.production)
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserCreation() {
  console.log('🧪 Testando criação de usuários na tabela profiles...\n');

  try {
    // 1. Verificar estado atual da tabela profiles
    console.log('📋 1. Verificando usuários existentes...');
    const { data: existingUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log(`   ❌ Erro ao buscar usuários: ${fetchError.message}`);
    } else {
      console.log(`   ✅ Encontrados ${existingUsers?.length || 0} usuários existentes`);
      if (existingUsers && existingUsers.length > 0) {
        console.log('   📊 Usuários existentes:');
        existingUsers.forEach(user => {
          console.log(`      - ${user.full_name} (${user.role}) - ID: ${user.id}`);
        });
      }
    }

    // 2. Criar um usuário de teste
    console.log('\n👤 2. Criando usuário de teste...');
    const testUserId = crypto.randomUUID();
    const testUserName = `Teste Usuario ${Date.now()}`;
    
    const { data: newUser, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        full_name: testUserName,
        role: 'nurse'
      })
      .select()
      .single();

    if (createError) {
      console.log(`   ❌ Erro ao criar usuário: ${createError.message}`);
      console.log(`   📝 Detalhes do erro:`, createError);
    } else {
      console.log('   ✅ Usuário criado com sucesso!');
      console.log(`   📧 Nome: ${newUser.full_name}`);
      console.log(`   🆔 ID: ${newUser.id}`);
      console.log(`   👔 Função: ${newUser.role}`);
      console.log(`   📅 Criado em: ${newUser.created_at}`);
    }

    // 3. Verificar se o usuário foi realmente criado
    console.log('\n🔍 3. Verificando se o usuário foi persistido...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (verifyError) {
      console.log(`   ❌ Erro ao verificar usuário: ${verifyError.message}`);
    } else if (verifyUser) {
      console.log('   ✅ Usuário encontrado na base de dados!');
      console.log(`   📊 Dados: ${JSON.stringify(verifyUser, null, 2)}`);
    } else {
      console.log('   ❌ Usuário não encontrado na base de dados');
    }

    // 4. Atualizar o usuário de teste
    console.log('\n✏️  4. Testando atualização do usuário...');
    const updatedName = `${testUserName} - Atualizado`;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: updatedName,
        role: 'doctor'
      })
      .eq('id', testUserId);

    if (updateError) {
      console.log(`   ❌ Erro ao atualizar usuário: ${updateError.message}`);
    } else {
      console.log('   ✅ Usuário atualizado com sucesso!');
      
      // Verificar a atualização
      const { data: updatedUser, error: fetchUpdatedError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      if (!fetchUpdatedError && updatedUser) {
        console.log(`   📊 Nome atualizado: ${updatedUser.full_name}`);
        console.log(`   👔 Função atualizada: ${updatedUser.role}`);
      }
    }

    // 5. Limpar dados de teste
    console.log('\n🗑️  5. Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);

    if (deleteError) {
      console.log(`   ❌ Erro ao deletar usuário de teste: ${deleteError.message}`);
    } else {
      console.log('   ✅ Usuário de teste removido com sucesso!');
    }

    // 6. Verificar estado final
    console.log('\n📊 6. Estado final da tabela profiles...');
    const { data: finalUsers, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.log(`   ❌ Erro ao buscar estado final: ${finalError.message}`);
    } else {
      console.log(`   ✅ Total de usuários na tabela: ${finalUsers?.length || 0}`);
      if (finalUsers && finalUsers.length > 0) {
        console.log('   📋 Usuários finais:');
        finalUsers.forEach(user => {
          console.log(`      - ${user.full_name} (${user.role}) - ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }

  console.log('\n🏁 Teste de criação de usuários concluído!');
}

// Executar o teste
testUserCreation().catch(console.error);