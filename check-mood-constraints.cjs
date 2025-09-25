const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTestPatient() {
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .limit(1);
    
  if (error || !patients || patients.length === 0) {
    console.error('❌ Erro ao buscar pacientes:', error);
    return null;
  }
  
  return patients[0];
}

async function testMoodConstraints() {
  console.log('🔍 Testando restrições dos campos de humor...\n');
  
  const patient = await getTestPatient();
  if (!patient) {
    console.log('❌ Não foi possível encontrar um paciente para teste');
    return;
  }
  
  const now = new Date().toISOString();
  const testValues = [
    { mood_scale: 1, happiness_scale: 1, description: 'valores mínimos (1, 1)' },
    { mood_scale: 5, happiness_scale: 5, description: 'valores médios (5, 5)' },
    { mood_scale: 10, happiness_scale: 10, description: 'valores máximos (10, 10)' },
    { mood_scale: 0, happiness_scale: 5, description: 'mood_scale = 0' },
    { mood_scale: 11, happiness_scale: 5, description: 'mood_scale = 11' },
    { mood_scale: 5, happiness_scale: 0, description: 'happiness_scale = 0' },
    { mood_scale: 5, happiness_scale: 11, description: 'happiness_scale = 11' },
  ];
  
  const successfulIds = [];
  
  for (const testValue of testValues) {
    console.log(`🧪 Testando ${testValue.description}...`);
    
    const moodData = {
      patient_id: patient.id,
      type: 'mood',
      occurred_at: now,
      mood_scale: testValue.mood_scale,
      happiness_scale: testValue.happiness_scale,
      mood_notes: `Teste: ${testValue.description}`
    };
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([moodData])
        .select();
        
      if (error) {
        console.log(`❌ Falhou: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`✅ Sucesso! ID: ${data[0].id}`);
        successfulIds.push(data[0].id);
      }
    } catch (err) {
      console.log(`❌ Exceção: ${err.message}`);
    }
  }
  
  // Cleanup
  if (successfulIds.length > 0) {
    console.log('\n🧹 Limpando eventos de teste...');
    const { error } = await supabase
      .from('events')
      .delete()
      .in('id', successfulIds);
      
    if (error) {
      console.error('❌ Erro ao limpar eventos:', error);
    } else {
      console.log(`✅ ${successfulIds.length} eventos de teste removidos`);
    }
  }
  
  console.log('\n📋 RESUMO:');
  console.log(`✅ Testes bem-sucedidos: ${successfulIds.length}/${testValues.length}`);
  
  if (successfulIds.length > 0) {
    console.log('✅ Valores válidos encontrados para mood_scale e happiness_scale');
  } else {
    console.log('❌ Nenhum valor foi aceito - verifique as restrições da tabela');
  }
}

testMoodConstraints().catch(console.error);