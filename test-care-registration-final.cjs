const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTestPatient() {
  console.log('🔍 Buscando paciente de teste...');
  
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('❌ Erro ao buscar pacientes:', error);
    return null;
  }
  
  if (!patients || patients.length === 0) {
    console.log('⚠️ Nenhum paciente encontrado');
    return null;
  }
  
  console.log('✅ Paciente encontrado:', patients[0].name);
  return patients[0];
}

async function testEventInsertion(eventType, eventData, description) {
  console.log(`\n🧪 Testando ${description}...`);
  
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select();
      
    if (error) {
      console.error(`❌ Erro ao inserir ${eventType}:`, error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ ${description} inserido com sucesso! ID: ${data[0].id}`);
      return data[0].id;
    }
    
    return false;
  } catch (err) {
    console.error(`❌ Exceção ao inserir ${eventType}:`, err.message);
    return false;
  }
}

async function cleanupTestEvents(eventIds) {
  if (eventIds.length === 0) return;
  
  console.log('\n🧹 Limpando eventos de teste...');
  
  const { error } = await supabase
    .from('events')
    .delete()
    .in('id', eventIds);
    
  if (error) {
    console.error('❌ Erro ao limpar eventos:', error);
  } else {
    console.log(`✅ ${eventIds.length} eventos de teste removidos`);
  }
}

async function runTests() {
  console.log('🚀 Iniciando teste de registro de cuidados...\n');
  
  // Get test patient
  const patient = await getTestPatient();
  if (!patient) {
    console.log('❌ Não foi possível encontrar um paciente para teste');
    return;
  }
  
  const testEventIds = [];
  const now = new Date().toISOString();
  
  // Test 1: Drink event (liquids)
  const drinkData = {
    patient_id: patient.id,
    type: 'drink',
    occurred_at: now,
    volume_ml: 250,
    notes: 'Teste de bebida - água'
  };
  
  const drinkId = await testEventInsertion('drink', drinkData, 'evento de bebida');
  if (drinkId) testEventIds.push(drinkId);
  
  // Test 2: Meal event (food)
  const mealData = {
    patient_id: patient.id,
    type: 'meal',
    occurred_at: now,
    meal_desc: 'Almoço completo',
    notes: 'Teste de refeição - 80% consumido'
  };
  
  const mealId = await testEventInsertion('meal', mealData, 'evento de refeição');
  if (mealId) testEventIds.push(mealId);
  
  // Test 3: Bathroom event
  const bathroomData = {
    patient_id: patient.id,
    type: 'bathroom',
    occurred_at: now,
    bathroom_type: 'urine',
    volume_ml: 300,
    notes: 'Teste de banheiro - urina'
  };
  
  const bathroomId = await testEventInsertion('bathroom', bathroomData, 'evento de banheiro');
  if (bathroomId) testEventIds.push(bathroomId);
  
  // Test 4: Mood event (humor)
  const moodData = {
    patient_id: patient.id,
    type: 'mood',
    occurred_at: now,
    mood_scale: 4,
    happiness_scale: 5,
    mood_notes: 'Paciente alegre e comunicativo'
  };
  
  const moodId = await testEventInsertion('mood', moodData, 'evento de humor');
  if (moodId) testEventIds.push(moodId);
  
  // Verify inserted events
  console.log('\n📊 Verificando eventos inseridos...');
  
  const { data: insertedEvents, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .in('id', testEventIds)
    .order('created_at', { ascending: false });
    
  if (fetchError) {
    console.error('❌ Erro ao verificar eventos:', fetchError);
  } else {
    console.log(`✅ ${insertedEvents.length} eventos verificados com sucesso:`);
    insertedEvents.forEach(event => {
      console.log(`   - ${event.type}: ${event.notes || event.meal_desc || 'sem descrição'}`);
    });
  }
  
  // Cleanup
  await cleanupTestEvents(testEventIds);
  
  // Summary
  console.log('\n📋 RESUMO DO TESTE:');
  console.log(`✅ Eventos testados: 4`);
  console.log(`✅ Eventos inseridos com sucesso: ${testEventIds.length}`);
  console.log(`✅ Taxa de sucesso: ${(testEventIds.length / 4 * 100).toFixed(1)}%`);
  
  if (testEventIds.length === 4) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! O sistema de registro de cuidados está funcionando corretamente.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os erros acima.');
  }
}

// Run the tests
runTests().catch(console.error);