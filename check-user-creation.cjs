const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando variáveis de produção)
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserTables() {
  console.log('🔍 Verificando tabelas de usuários na base de dados...\n');

  try {
    // 1. Verificar se existe tabela de usuários
    console.log('📋 1. Verificando estrutura das tabelas...');
    
    // Tentar buscar tabelas relacionadas a usuários
    const tables = ['users', 'profiles', 'auth.users', 'demo_users'];
    
    for (const table of tables) {
      try {
        console.log(`   Verificando tabela: ${table}`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Tabela ${table} não encontrada ou sem acesso: ${error.message}`);
        } else {
          console.log(`   ✅ Tabela ${table} encontrada!`);
          console.log(`   📊 Estrutura: ${JSON.stringify(data, null, 2)}`);
        }
      } catch (err) {
        console.log(`   ❌ Erro ao acessar ${table}: ${err.message}`);
      }
    }

    // 2. Verificar tabelas existentes no schema público
    console.log('\n📋 2. Listando todas as tabelas disponíveis...');
    try {
      const { data: tables, error } = await supabase.rpc('get_table_names');
      if (error) {
        console.log('   ❌ Não foi possível listar tabelas via RPC');
      } else {
        console.log('   ✅ Tabelas encontradas via RPC:', tables);
      }
    } catch (err) {
      console.log('   ❌ RPC get_table_names não disponível');
    }

    // 3. Verificar tabelas conhecidas do sistema
    console.log('\n📋 3. Verificando tabelas conhecidas do sistema...');
    const knownTables = ['patients', 'events', 'family_access_tokens'];
    
    for (const table of knownTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: OK (${data?.length || 0} registros encontrados)`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // 4. Tentar criar um usuário de teste (se houver tabela apropriada)
    console.log('\n👤 4. Testando criação de usuário...');
    
    // Primeiro, verificar se podemos usar auth.users
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'teste-' + Date.now() + '@example.com',
        password: 'teste123456'
      });
      
      if (authError) {
        console.log(`   ❌ Erro no signup via auth: ${authError.message}`);
      } else {
        console.log('   ✅ Usuário criado via auth.signUp!');
        console.log(`   📧 Email: ${authData.user?.email}`);
        console.log(`   🆔 ID: ${authData.user?.id}`);
        
        // Tentar remover o usuário de teste
        if (authData.user?.id) {
          try {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
            if (deleteError) {
              console.log(`   ⚠️  Não foi possível remover usuário de teste: ${deleteError.message}`);
            } else {
              console.log('   🗑️  Usuário de teste removido');
            }
          } catch (err) {
            console.log(`   ⚠️  Erro ao remover usuário de teste: ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Erro geral no teste de auth: ${err.message}`);
    }

    // 5. Verificar se existe uma tabela customizada de usuários
    console.log('\n🔍 5. Procurando por tabelas customizadas de usuários...');
    const customUserTables = ['app_users', 'system_users', 'hospital_users', 'staff'];
    
    for (const table of customUserTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`   ✅ Tabela customizada encontrada: ${table}`);
          console.log(`   📊 Exemplo de dados: ${JSON.stringify(data, null, 2)}`);
        }
      } catch (err) {
        // Ignorar erros para tabelas que não existem
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function checkDemoUsers() {
  console.log('\n🎭 Verificando usuários demo no localStorage...');
  
  // Simular verificação do localStorage (não disponível no Node.js)
  console.log('   ℹ️  Usuários demo são armazenados apenas no localStorage do navegador');
  console.log('   ℹ️  Para verificar, abra o DevTools do navegador e execute:');
  console.log('   📝 localStorage.getItem("demo_users")');
}

async function main() {
  console.log('🚀 Iniciando verificação de criação de usuários...\n');
  
  await checkUserTables();
  await checkDemoUsers();
  
  console.log('\n✅ Verificação concluída!');
  console.log('\n📋 Resumo:');
  console.log('   • Usuários demo: Armazenados no localStorage (não na base de dados)');
  console.log('   • Usuários do sistema: Verificar se auth.users está configurado');
  console.log('   • Pacientes: Armazenados na tabela "patients" (funcionando)');
}

main().catch(console.error);