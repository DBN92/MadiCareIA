const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHumorCreation() {
  console.log('🧪 Testando criação de registro de humor...\n');

  try {
    // 1. Verificar tipos de evento disponíveis
    console.log('1. Verificando tipos de evento disponíveis...');
    const { data: existingEvents, error: checkError } = await supabase
      .from('events')
      .select('type')
      .limit(10);

    if (checkError) {
      console.error('❌ Erro ao verificar eventos:', checkError.message);
      return;
    }

    const uniqueTypes = [...new Set(existingEvents.map(e => e.type))];
    console.log('📋 Tipos únicos encontrados:', uniqueTypes.sort());

    // 2. Buscar um paciente para teste
    console.log('\n2. Buscando paciente para teste...');
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(1);

    if (patientError) {
      console.error('❌ Erro ao buscar pacientes:', patientError.message);
      return;
    }

    if (!patients || patients.length === 0) {
      console.error('❌ Nenhum paciente encontrado');
      return;
    }

    const testPatient = patients[0];
    console.log(`✅ Paciente encontrado: ${testPatient.full_name} (ID: ${testPatient.id})`);

    // 3. Tentar criar um registro de humor
    console.log('\n3. Tentando criar registro de humor...');
    const humorData = {
      patient_id: testPatient.id,
      type: 'humor',
      occurred_at: new Date().toISOString(),
      mood_scale: 4,
      happiness_scale: 5,
      mood_notes: 'Teste de criação de registro de humor - paciente alegre hoje!'
      // Removendo created_by que precisa ser UUID
    };

    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert([humorData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar registro de humor:', createError.message);
      console.log('📝 Detalhes do erro:', createError);
      
      // Verificar se é problema de enum
      if (createError.message.includes('invalid input value for enum')) {
        console.log('\n🔧 O enum event_type ainda não aceita "humor"');
        console.log('📋 Execute o script fix-humor-enum-direct.sql no painel do Supabase');
      }
      return;
    }

    console.log('✅ Registro de humor criado com sucesso!');
    console.log('📊 Dados do registro:', {
      id: newEvent.id,
      type: newEvent.type,
      mood_scale: newEvent.mood_scale,
      happiness_scale: newEvent.happiness_scale,
      mood_notes: newEvent.mood_notes,
      created_at: newEvent.created_at
    });

    // 4. Verificar se o registro foi salvo corretamente
    console.log('\n4. Verificando registro salvo...');
    const { data: savedEvent, error: verifyError } = await supabase
      .from('events')
      .select('*')
      .eq('id', newEvent.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar registro:', verifyError.message);
      return;
    }

    console.log('✅ Registro verificado com sucesso!');
    console.log('📋 Dados completos:', savedEvent);

    // 5. Contar registros de humor
    console.log('\n5. Contando registros de humor...');
    const { data: humorCount, error: countError } = await supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('type', 'humor');

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError.message);
    } else {
      console.log(`📊 Total de registros de humor: ${humorCount.length}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testHumorCreation();