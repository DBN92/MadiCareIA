const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Iniciando aplicação da migração de prontuário médico...\n');

  try {
    // Ler o arquivo SQL das tabelas de prontuário médico
    const migrationSQL = fs.readFileSync('./create-medical-records-tables.sql', 'utf8');
    
    console.log('📄 Arquivo SQL carregado com sucesso');
    console.log('📝 Conteúdo da migração:');
    console.log('─'.repeat(50));
    console.log(migrationSQL.substring(0, 500) + '...\n');

    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`🔧 Executando ${commands.length} comandos SQL...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.toLowerCase().includes('select')) {
        // Pular comandos SELECT de verificação
        console.log(`⏭️  Pulando comando de verificação: ${command.substring(0, 50)}...`);
        continue;
      }

      try {
        console.log(`📋 Executando comando ${i + 1}/${commands.length}:`);
        console.log(`   ${command.substring(0, 80)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.log(`❌ Erro: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Sucesso`);
          successCount++;
        }
        
        // Pequena pausa entre comandos
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.log(`❌ Erro inesperado: ${err.message}`);
        errorCount++;
      }
      
      console.log('');
    }

    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Comandos com erro: ${errorCount}`);
    console.log(`📈 Taxa de sucesso: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%\n`);

    // Verificar se as colunas foram adicionadas
    console.log('🔍 Verificando se as colunas foram adicionadas...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'events')
      .in('column_name', [
        'med_route', 'drain_type', 'left_amount', 'right_amount',
        'left_aspect', 'right_aspect', 'systolic_bp', 'diastolic_bp',
        'heart_rate', 'temperature', 'oxygen_saturation', 'respiratory_rate'
      ]);

    if (columnsError) {
      console.log(`❌ Erro ao verificar colunas: ${columnsError.message}`);
    } else {
      console.log('\n📋 Colunas adicionadas:');
      columns.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n🎉 Migração concluída!');
    
  } catch (error) {
    console.error('💥 Erro fatal durante a migração:', error.message);
    process.exit(1);
  }
}

// Executar a migração
applyMigration();