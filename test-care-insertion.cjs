const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCareEventInsertion() {
  try {
    console.log('Testando inserção de diferentes tipos de cuidados...');
    
    // Buscar um paciente existente
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(1);
    
    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError);
      return;
    }
    
    if (!patients || patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado. Criando um paciente de teste...');
      
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert([{
          full_name: 'Paciente Teste',
          birth_date: '1980-01-01',
          bed: 'Leito 999',
          notes: 'Paciente criado para teste',
          is_active: true
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar paciente:', createError);
        return;
      }
      
      patients.push(newPatient);
      console.log('✅ Paciente de teste criado:', newPatient.full_name);
    }
    
    const patientId = patients[0].id;
    console.log('Usando paciente:', patients[0].full_name, 'ID:', patientId);
    
    // Teste 1: Líquidos
    console.log('\n1. Testando registro de líquidos...');
    const liquidEvent = {
      patient_id: patientId,
      type: 'drink',
      volume_ml: 250,
      liquid_type: 'água',
      notes: 'Teste de líquidos',
      occurred_at: new Date().toISOString()
    };
    
    const { data: liquidData, error: liquidError } = await supabase
      .from('events')
      .insert([liquidEvent])
      .select();
    
    if (liquidError) {
      console.error('❌ Erro ao inserir líquidos:', liquidError);
    } else {
      console.log('✅ Líquidos inserido com sucesso');
    }
    
    // Teste 2: Medicação
    console.log('\n2. Testando registro de medicação...');
    const medicationEvent = {
      patient_id: patientId,
      type: 'medication',
      med_name: 'Dipirona',
      med_dose: '500mg',
      med_route: 'oral',
      notes: 'Teste de medicação',
      occurred_at: new Date().toISOString()
    };
    
    const { data: medData, error: medError } = await supabase
      .from('events')
      .insert([medicationEvent])
      .select();
    
    if (medError) {
      console.error('❌ Erro ao inserir medicação:', medError);
    } else {
      console.log('✅ Medicação inserida com sucesso');
    }
    
    // Teste 3: Sinais Vitais
    console.log('\n3. Testando registro de sinais vitais...');
    const vitalSignsEvent = {
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
    };
    
    const { data: vitalData, error: vitalError } = await supabase
      .from('events')
      .insert([vitalSignsEvent])
      .select();
    
    if (vitalError) {
      console.error('❌ Erro ao inserir sinais vitais:', vitalError);
    } else {
      console.log('✅ Sinais vitais inseridos com sucesso');
    }
    
    // Teste 4: Dreno
    console.log('\n4. Testando registro de dreno...');
    const drainEvent = {
      patient_id: patientId,
      type: 'drain',
      drain_type: 'portovac',
      left_amount: 50,
      right_amount: 30,
      left_aspect: 'seroso',
      right_aspect: 'sanguinolento',
      notes: 'Teste de dreno',
      occurred_at: new Date().toISOString()
    };
    
    const { data: drainData, error: drainError } = await supabase
      .from('events')
      .insert([drainEvent])
      .select();
    
    if (drainError) {
      console.error('❌ Erro ao inserir dreno:', drainError);
    } else {
      console.log('✅ Dreno inserido com sucesso');
    }
    
    console.log('\n✅ Teste de inserção concluído!');
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testCareEventInsertion();