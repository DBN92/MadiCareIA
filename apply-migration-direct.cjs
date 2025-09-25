const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixjqjqjqjqjqjqjqjqjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anFqcWpxanFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzE4NzEsImV4cCI6MjA1MTUwNzg3MX0.Iq8Iq8Iq8Iq8Iq8Iq8Iq8Iq8Iq8Iq8Iq8Iq8Iq8Iq8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentColumns() {
  console.log('🔍 Verificando colunas atuais da tabela events...\n');

  try {
    // Primeiro, vamos verificar se conseguimos acessar a tabela
    const { data: sampleData, error: sampleError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log(`❌ Erro ao acessar tabela events: ${sampleError.message}`);
      return;
    }

    console.log('✅ Tabela events acessível');
    
    if (sampleData && sampleData.length > 0) {
      console.log('\n📋 Colunas existentes na tabela:');
      const columns = Object.keys(sampleData[0]);
      columns.forEach(col => {
        console.log(`   • ${col}`);
      });

      // Verificar quais colunas estão faltando
      const requiredColumns = [
        'med_route', 'drain_type', 'left_amount', 'right_amount',
        'left_aspect', 'right_aspect', 'systolic_bp', 'diastolic_bp',
        'heart_rate', 'temperature', 'oxygen_saturation', 'respiratory_rate'
      ];

      console.log('\n🔍 Verificando colunas necessárias:');
      const missingColumns = [];
      const existingColumns = [];

      requiredColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`   ✅ ${col} - existe`);
          existingColumns.push(col);
        } else {
          console.log(`   ❌ ${col} - faltando`);
          missingColumns.push(col);
        }
      });

      console.log(`\n📊 Resumo:`);
      console.log(`   ✅ Colunas existentes: ${existingColumns.length}`);
      console.log(`   ❌ Colunas faltando: ${missingColumns.length}`);

      if (missingColumns.length === 0) {
        console.log('\n🎉 Todas as colunas necessárias já existem!');
      } else {
        console.log('\n⚠️  Algumas colunas ainda precisam ser adicionadas.');
        console.log('💡 Sugestão: Execute a migração manualmente no painel do Supabase.');
      }

    } else {
      console.log('⚠️  Tabela events está vazia, não é possível verificar colunas desta forma.');
    }

  } catch (error) {
    console.error('💥 Erro ao verificar colunas:', error.message);
  }
}

async function testNewColumns() {
  console.log('\n🧪 Testando inserção com novas colunas...\n');

  try {
    // Buscar um paciente para teste
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (patientsError || !patients || patients.length === 0) {
      console.log('❌ Não foi possível encontrar um paciente para teste');
      return;
    }

    const patientId = patients[0].id;
    console.log(`✅ Usando paciente ID: ${patientId}`);

    // Testar inserção de medicação
    console.log('\n💊 Testando inserção de medicação...');
    const { data: medData, error: medError } = await supabase
      .from('events')
      .insert({
        patient_id: patientId,
        type: 'medication',
        med_name: 'Paracetamol',
        med_dose: '500mg',
        med_route: 'oral',
        notes: 'Teste de medicação',
        occurred_at: new Date().toISOString()
      })
      .select();

    if (medError) {
      console.log(`❌ Erro ao inserir medicação: ${medError.message}`);
    } else {
      console.log(`✅ Medicação inserida com sucesso! ID: ${medData[0].id}`);
    }

    // Testar inserção de dreno
    console.log('\n🩸 Testando inserção de dreno...');
    const { data: drainData, error: drainError } = await supabase
      .from('events')
      .insert({
        patient_id: patientId,
        type: 'drain',
        drain_type: 'chest',
        left_amount: 50,
        right_amount: 30,
        left_aspect: 'clear',
        right_aspect: 'bloody',
        notes: 'Teste de dreno',
        occurred_at: new Date().toISOString()
      })
      .select();

    if (drainError) {
      console.log(`❌ Erro ao inserir dreno: ${drainError.message}`);
    } else {
      console.log(`✅ Dreno inserido com sucesso! ID: ${drainData[0].id}`);
    }

    // Testar inserção de sinais vitais
    console.log('\n❤️  Testando inserção de sinais vitais...');
    const { data: vitalData, error: vitalError } = await supabase
      .from('events')
      .insert({
        patient_id: patientId,
        type: 'vital_signs',
        systolic_bp: 120,
        diastolic_bp: 80,
        heart_rate: 72,
        temperature: 36.5,
        oxygen_saturation: 98,
        respiratory_rate: 16,
        notes: 'Teste de sinais vitais',
        occurred_at: new Date().toISOString()
      })
      .select();

    if (vitalError) {
      console.log(`❌ Erro ao inserir sinais vitais: ${vitalError.message}`);
    } else {
      console.log(`✅ Sinais vitais inseridos com sucesso! ID: ${vitalData[0].id}`);
    }

    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    const idsToDelete = [];
    if (medData && medData[0]) idsToDelete.push(medData[0].id);
    if (drainData && drainData[0]) idsToDelete.push(drainData[0].id);
    if (vitalData && vitalData[0]) idsToDelete.push(vitalData[0].id);

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.log(`⚠️  Erro ao limpar dados de teste: ${deleteError.message}`);
      } else {
        console.log(`✅ ${idsToDelete.length} registros de teste removidos`);
      }
    }

  } catch (error) {
    console.error('💥 Erro durante teste:', error.message);
  }
}

async function main() {
  console.log('🚀 Verificação da Migração da Tabela Events\n');
  
  await checkCurrentColumns();
  await testNewColumns();
  
  console.log('\n🎯 Próximos passos:');
  console.log('   1. Se as colunas não existem, execute a migração manualmente no Supabase');
  console.log('   2. Atualize os tipos TypeScript');
  console.log('   3. Restaure as funcionalidades no CareForm');
  console.log('   4. Teste todos os tipos de cuidados');
}

main();