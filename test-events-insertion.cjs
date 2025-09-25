const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventInsertion() {
  console.log('🧪 Testando inserção de dados na tabela events...\n');

  try {
    // 1. Primeiro, vamos verificar se conseguimos ler a tabela events
    console.log('📖 1. Testando leitura da tabela events...');
    const { data: existingEvents, error: readError } = await supabase
      .from('events')
      .select('*')
      .limit(5);

    if (readError) {
      console.error('❌ Erro ao ler tabela events:', readError.message);
      return;
    }

    console.log(`✅ Leitura bem-sucedida. Encontrados ${existingEvents.length} registros existentes.`);
    if (existingEvents.length > 0) {
      console.log('📋 Exemplo de registro existente:', JSON.stringify(existingEvents[0], null, 2));
    }

    // 2. Verificar se temos pacientes disponíveis
    console.log('\n👥 2. Verificando pacientes disponíveis...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(5);

    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError.message);
      return;
    }

    if (patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado. Criando um paciente de teste...');
      
      const { data: newPatient, error: createPatientError } = await supabase
        .from('patients')
        .insert({
          full_name: 'Paciente Teste',
          bed: 'Leito 999',
          birth_date: '1980-01-01',
          admission_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (createPatientError) {
        console.error('❌ Erro ao criar paciente de teste:', createPatientError.message);
        return;
      }

      console.log('✅ Paciente de teste criado:', newPatient.full_name);
      patients.push(newPatient);
    }

    const testPatient = patients[0];
    console.log(`✅ Usando paciente: ${testPatient.full_name} (ID: ${testPatient.id})`);

    // 3. Tentar inserir um evento de teste
    console.log('\n💉 3. Testando inserção de evento...');
    
    const testEvent = {
      patient_id: testPatient.id,
      type: 'drink',
      occurred_at: new Date().toISOString(),
      liquid_type: 'water',
      volume_ml: 250,
      notes: 'Teste de inserção de evento - ' + new Date().toLocaleString()
    };

    console.log('📝 Dados do evento de teste:', JSON.stringify(testEvent, null, 2));

    const { data: insertedEvent, error: insertError } = await supabase
      .from('events')
      .insert(testEvent)
      .select()
      .single();

    if (insertError) {
      console.error('❌ ERRO AO INSERIR EVENTO:', insertError.message);
      console.error('📋 Detalhes do erro:', JSON.stringify(insertError, null, 2));
      
      // Verificar se é um problema de RLS (Row Level Security)
      if (insertError.message.includes('RLS') || insertError.message.includes('policy')) {
        console.log('\n🔒 Possível problema de RLS (Row Level Security)');
        console.log('💡 Sugestão: Verificar políticas de segurança na tabela events');
      }
      
      return;
    }

    console.log('✅ EVENTO INSERIDO COM SUCESSO!');
    console.log('📋 Evento criado:', JSON.stringify(insertedEvent, null, 2));

    // 4. Verificar se o evento foi realmente salvo
    console.log('\n🔍 4. Verificando se o evento foi salvo...');
    const { data: savedEvent, error: verifyError } = await supabase
      .from('events')
      .select('*')
      .eq('id', insertedEvent.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar evento salvo:', verifyError.message);
      return;
    }

    console.log('✅ Evento confirmado na base de dados!');
    console.log('📋 Dados salvos:', JSON.stringify(savedEvent, null, 2));

    // 5. Limpar o evento de teste
    console.log('\n🧹 5. Limpando evento de teste...');
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', insertedEvent.id);

    if (deleteError) {
      console.log('⚠️ Aviso: Não foi possível remover o evento de teste:', deleteError.message);
    } else {
      console.log('✅ Evento de teste removido com sucesso.');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    console.error('📋 Stack trace:', error.stack);
  }
}

// Executar o teste
testEventInsertion()
  .then(() => {
    console.log('\n🎯 Teste de inserção concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });