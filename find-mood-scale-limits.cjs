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

async function testValue(patient, mood_scale, happiness_scale, description) {
  const now = new Date().toISOString();
  
  const moodData = {
    patient_id: patient.id,
    type: 'mood',
    occurred_at: now,
    mood_scale: mood_scale,
    happiness_scale: happiness_scale,
    mood_notes: `Teste: ${description}`
  };
  
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([moodData])
      .select();
      
    if (error) {
      return { success: false, error: error.message };
    } else if (data && data.length > 0) {
      // Cleanup immediately
      await supabase.from('events').delete().eq('id', data[0].id);
      return { success: true, id: data[0].id };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
  
  return { success: false, error: 'Unknown error' };
}

async function findValidRange() {
  console.log('🔍 Encontrando limites válidos para mood_scale e happiness_scale...\n');
  
  const patient = await getTestPatient();
  if (!patient) {
    console.log('❌ Não foi possível encontrar um paciente para teste');
    return;
  }
  
  // Test mood_scale range (keeping happiness_scale at 5)
  console.log('📊 Testando limites do mood_scale:');
  let moodMin = null, moodMax = null;
  
  for (let i = 1; i <= 15; i++) {
    const result = await testValue(patient, i, 5, `mood_scale=${i}`);
    if (result.success) {
      if (moodMin === null) moodMin = i;
      moodMax = i;
      console.log(`✅ mood_scale=${i} - válido`);
    } else {
      console.log(`❌ mood_scale=${i} - inválido`);
      if (moodMin !== null) break; // Stop after finding the upper limit
    }
  }
  
  // Test happiness_scale range (keeping mood_scale at 5)
  console.log('\n📊 Testando limites do happiness_scale:');
  let happinessMin = null, happinessMax = null;
  
  for (let i = 1; i <= 15; i++) {
    const result = await testValue(patient, 5, i, `happiness_scale=${i}`);
    if (result.success) {
      if (happinessMin === null) happinessMin = i;
      happinessMax = i;
      console.log(`✅ happiness_scale=${i} - válido`);
    } else {
      console.log(`❌ happiness_scale=${i} - inválido`);
      if (happinessMin !== null) break; // Stop after finding the upper limit
    }
  }
  
  console.log('\n📋 RESUMO DOS LIMITES VÁLIDOS:');
  console.log(`🎯 mood_scale: ${moodMin} - ${moodMax}`);
  console.log(`🎯 happiness_scale: ${happinessMin} - ${happinessMax}`);
  
  // Test a valid combination
  if (moodMin && moodMax && happinessMin && happinessMax) {
    console.log('\n🧪 Testando combinação válida final...');
    const result = await testValue(patient, moodMax, happinessMax, 'teste final');
    if (result.success) {
      console.log('✅ Combinação válida confirmada!');
    } else {
      console.log('❌ Erro na combinação final:', result.error);
    }
  }
}

findValidRange().catch(console.error);