const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLSetup() {
  console.log('🔧 Executando configuração SQL do sistema de autenticação...\n');

  try {
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'setup-auth-profiles.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Arquivo SQL carregado:', sqlFilePath);
    console.log('📏 Tamanho do conteúdo:', sqlContent.length, 'caracteres\n');

    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log('📋 Total de comandos SQL a executar:', sqlCommands.length, '\n');

    // Executar cada comando SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      if (command.length < 10) continue; // Pular comandos muito pequenos
      
      console.log(`⚡ Executando comando ${i + 1}/${sqlCommands.length}:`);
      console.log(`   ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });

        if (error) {
          // Tentar executar diretamente se RPC falhar
          console.log('   ⚠️  RPC falhou, tentando execução direta...');
          
          // Para comandos CREATE TABLE, usar from()
          if (command.toUpperCase().includes('CREATE TABLE')) {
            console.log('   ℹ️  Comando CREATE TABLE detectado - pode precisar ser executado no Dashboard');
          }
          
          console.log('   ❌ Erro:', error.message);
        } else {
          console.log('   ✅ Sucesso');
        }
      } catch (execError) {
        console.log('   ❌ Erro de execução:', execError.message);
      }

      // Pequena pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎯 Configuração SQL concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Se houver erros acima, execute o SQL manualmente no Supabase Dashboard');
    console.log('2. Teste a configuração: node test-auth-setup.cjs');
    console.log('3. Acesse: https://supabase.com/dashboard/project/envqimsupjgovuofbghj');

  } catch (error) {
    console.error('❌ Erro ao executar configuração SQL:', error.message);
    console.log('\n💡 Solução alternativa:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/envqimsupjgovuofbghj');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o conteúdo do arquivo setup-auth-profiles.sql');
    console.log('4. Execute manualmente');
  }
}

// Executar o script
executeSQLSetup();