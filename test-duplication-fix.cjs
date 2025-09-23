const { createClient } = require('@supabase/supabase-js');

// Configurações de produção
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDuplicationFix() {
  console.log('🔧 TESTANDO CORREÇÃO DE DUPLICAÇÃO');
  console.log('==========================================');
  
  try {
    // 1. Buscar um paciente ativo
    console.log('\n1. Buscando paciente ativo...');
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('is_active', true)
      .limit(1);
    
    if (patientError || !patients || patients.length === 0) {
      console.error('❌ Erro ao buscar paciente:', patientError?.message || 'Nenhum paciente encontrado');
      return;
    }
    
    const testPatient = patients[0];
    console.log(`✅ Paciente encontrado: ${testPatient.full_name} (ID: ${testPatient.id})`);
    
    // 2. Limpar eventos duplicados existentes
    console.log('\n2. Limpando eventos duplicados existentes...');
    const { data: existingEvents } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatient.id)
      .order('created_at', { ascending: false });
    
    if (existingEvents && existingEvents.length > 0) {
      // Identificar duplicatas
      const duplicateGroups = {};
      existingEvents.forEach(event => {
        const key = `${event.patient_id}_${event.type}_${event.occurred_at}_${event.med_name || ''}_${event.meal_desc || ''}_${event.bathroom_type || ''}_${event.volume_ml || ''}`;
        if (!duplicateGroups[key]) {
          duplicateGroups[key] = [];
        }
        duplicateGroups[key].push(event);
      });
      
      const duplicates = Object.values(duplicateGroups).filter(group => group.length > 1);
      
      if (duplicates.length > 0) {
        console.log(`⚠️  Encontradas ${duplicates.length} grupos de duplicatas. Removendo...`);
        
        for (const group of duplicates) {
          // Manter apenas o primeiro evento de cada grupo
          const toDelete = group.slice(1);
          const deleteIds = toDelete.map(e => e.id);
          
          const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .in('id', deleteIds);
          
          if (deleteError) {
            console.error(`❌ Erro ao deletar duplicatas: ${deleteError.message}`);
          } else {
            console.log(`✅ Removidos ${toDelete.length} eventos duplicados do grupo`);
          }
        }
      } else {
        console.log('✅ Nenhuma duplicata encontrada');
      }
    }
    
    // 3. Testar inserção única
    console.log('\n3. Testando inserção de evento único...');
    
    const testEvent = {
      patient_id: testPatient.id,
      type: 'drink',
      volume_ml: 150,
      occurred_at: new Date().toISOString(),
      notes: 'Teste correção duplicação - ' + new Date().getTime()
    };
    
    console.log('📝 Inserindo evento de teste...');
    const { data: insertedEvent, error: insertError } = await supabase
      .from('events')
      .insert([testEvent])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao inserir evento:', insertError.message);
      return;
    }
    
    console.log(`✅ Evento inserido com sucesso: ${insertedEvent.id}`);
    
    // 4. Aguardar um pouco e verificar se não há duplicatas
    console.log('\n4. Aguardando e verificando duplicatas...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: checkEvents, error: checkError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatient.id)
      .like('notes', '%Teste correção duplicação%');
    
    if (checkError) {
      console.error('❌ Erro ao verificar eventos:', checkError.message);
      return;
    }
    
    console.log(`📊 Eventos de teste encontrados: ${checkEvents.length}`);
    
    if (checkEvents.length === 1) {
      console.log('✅ SUCESSO! Nenhuma duplicação detectada');
    } else if (checkEvents.length > 1) {
      console.log('❌ FALHA! Ainda há duplicação');
      checkEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ID: ${event.id} - Criado em: ${new Date(event.created_at).toLocaleString('pt-BR')}`);
      });
    } else {
      console.log('⚠️  Nenhum evento de teste encontrado');
    }
    
    // 5. Limpeza
    console.log('\n5. Limpeza dos dados de teste...');
    const { error: cleanupError } = await supabase
      .from('events')
      .delete()
      .eq('patient_id', testPatient.id)
      .like('notes', '%Teste correção duplicação%');
    
    if (cleanupError) {
      console.log('⚠️  Erro na limpeza:', cleanupError.message);
    } else {
      console.log('✅ Dados de teste removidos');
    }
    
    console.log('\n🎉 TESTE DE CORREÇÃO CONCLUÍDO!');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testDuplicationFix();
