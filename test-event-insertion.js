const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando variáveis de ambiente ou valores padrão)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventInsertion() {
  try {
    console.log('🔍 Testando inserção de eventos...');
    console.log('==========================================');
    
    // 1. Buscar um paciente existente
    console.log('1. Buscando pacientes...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(1);
    
    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError.message);
      return;
    }
    
    if (!patients || patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado. Criando um paciente de teste...');
      
      // Criar um paciente de teste
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert([{
          full_name: 'Paciente Teste',
          bed: 'Leito 999',
          admission_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar paciente:', createError.message);
        return;
      }
      
      console.log('✅ Paciente criado:', newPatient.full_name);
      patients.push(newPatient);
    }
    
    const patient = patients[0];
    console.log('✅ Usando paciente:', patient.full_name, '(ID:', patient.id, ')');
    
    // 2. Inserir evento de teste
    console.log('\n2. Inserindo evento de teste...');
    const testEvent = {
      patient_id: patient.id,
      date: new Date().toISOString().split('T')[0],
      type: 'mood',
      notes: 'Teste de evento - ' + new Date().toLocaleTimeString('pt-BR'),
      mood_scale: 3
    };
    
    console.log('Dados do evento:', JSON.stringify(testEvent, null, 2));
    
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert([testEvent])
      .select()
      .single();
    
    if (eventError) {
      console.error('❌ Erro ao inserir evento:', eventError.message);
      console.error('Detalhes:', eventError);
      return;
    }
    
    console.log('✅ Evento inserido com sucesso!');
    console.log('   ID:', eventData.id);
    console.log('   Tipo:', eventData.type);
    console.log('   Data:', eventData.date);
    console.log('   Criado em:', eventData.created_at);
    
    // 3. Buscar eventos recentes
    console.log('\n3. Buscando eventos recentes...');
    const { data: recentEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar eventos:', fetchError.message);
      return;
    }
    
    console.log('✅ Eventos encontrados:', recentEvents.length);
    recentEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.type} - ${event.notes || 'Sem notas'} (${new Date(event.created_at).toLocaleString('pt-BR')})`);
    });
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('==========================================');
    console.log('✅ A funcionalidade de salvamento está funcionando');
    console.log('💡 Se os eventos não aparecem na interface, verifique:');
    console.log('   - Se o paciente correto está selecionado');
    console.log('   - Se há filtros aplicados');
    console.log('   - Se o estado do React está atualizando');
    
  } catch (error) {
    console.error('💥 Erro geral no teste:', error.message);
    console.error('📋 Stack trace:', error.stack);
  }
}

// Executar o teste
testEventInsertion().catch(console.error);