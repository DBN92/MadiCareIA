const { createClient } = require('@supabase/supabase-js');

// Configurações de produção
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductionEvents() {
  console.log('🔍 TESTANDO SALVAMENTO DE EVENTOS EM PRODUÇÃO');
  console.log('==========================================');
  
  try {
    // 1. Verificar conexão com Supabase
    console.log('\n1. Verificando conexão com Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('events')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError.message);
      return;
    }
    console.log('✅ Conexão com Supabase estabelecida');

    // 2. Verificar pacientes existentes
    console.log('\n2. Verificando pacientes existentes...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(5);
    
    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError.message);
      return;
    }
    
    console.log(`📋 Pacientes encontrados: ${patients.length}`);
    if (patients.length > 0) {
      patients.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.full_name} (ID: ${patient.id})`);
      });
    }

    // 3. Verificar eventos existentes
    console.log('\n3. Verificando eventos existentes...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError.message);
      return;
    }
    
    console.log(`📊 Eventos encontrados: ${events.length}`);
    if (events.length > 0) {
      console.log('\n📋 Últimos eventos:');
      events.forEach((event, index) => {
        const date = new Date(event.created_at).toLocaleString('pt-BR');
        console.log(`   ${index + 1}. ${event.type} - ${date} (Paciente: ${event.patient_id})`);
      });
    }

    // 4. Teste de inserção (se houver pacientes)
    if (patients.length > 0) {
      console.log('\n4. Testando inserção de evento de teste...');
      const testPatientId = patients[0].id;
      
      const testEvent = {
        patient_id: testPatientId,
        type: 'note',
        occurred_at: new Date().toISOString(),
        notes: 'Teste de produção - ' + new Date().toLocaleString('pt-BR')
      };
      
      const { data: insertedEvent, error: insertError } = await supabase
        .from('events')
        .insert([testEvent])
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir evento de teste:', insertError.message);
      } else {
        console.log('✅ Evento de teste inserido com sucesso!');
        console.log(`📝 ID do evento: ${insertedEvent.id}`);
        
        // Limpar o evento de teste
        await supabase
          .from('events')
          .delete()
          .eq('id', insertedEvent.id);
        console.log('🧹 Evento de teste removido');
      }
    }

    console.log('\n🎉 TESTE DE PRODUÇÃO CONCLUÍDO!');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testProductionEvents();
