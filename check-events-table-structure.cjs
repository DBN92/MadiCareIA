const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsTableStructure() {
  console.log('🔍 Verificando estrutura real da tabela events...\n');

  try {
    // Tentar buscar um evento existente para ver a estrutura
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError.message);
      return;
    }

    if (events && events.length > 0) {
      console.log('✅ Estrutura da tabela events (baseada em evento existente):');
      console.log('📋 Colunas disponíveis:');
      
      const columns = Object.keys(events[0]);
      columns.forEach((column, index) => {
        const value = events[0][column];
        const type = typeof value;
        console.log(`   ${index + 1}. ${column} (${type}): ${value}`);
      });
    } else {
      console.log('⚠️ Nenhum evento encontrado na tabela. Tentando inserir um evento mínimo para descobrir a estrutura...');
      
      // Buscar um paciente
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .limit(1);

      if (patients && patients.length > 0) {
        const testData = {
          patient_id: patients[0].id,
          occurred_at: new Date().toISOString(),
          type: 'bathroom',
          notes: 'Teste de estrutura'
        };

        console.log('\n💉 Inserindo evento de teste para descobrir estrutura...');
        const { data: insertResult, error: insertError } = await supabase
          .from('events')
          .insert(testData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Erro ao inserir evento de teste:', insertError.message);
        } else {
          console.log('✅ Evento de teste inserido. Estrutura descoberta:');
          console.log('📋 Colunas disponíveis:');
          
          const columns = Object.keys(insertResult);
          columns.forEach((column, index) => {
            const value = insertResult[column];
            const type = typeof value;
            console.log(`   ${index + 1}. ${column} (${type}): ${value}`);
          });

          // Limpar evento de teste
          await supabase.from('events').delete().eq('id', insertResult.id);
          console.log('\n🧹 Evento de teste removido.');
        }
      }
    }

    // Verificar os valores válidos do enum event_type
    console.log('\n🎯 Verificando valores válidos do enum event_type...');
    
    // Tentar inserir com diferentes tipos para descobrir os válidos
    const possibleTypes = ['drink', 'meal', 'medication', 'bathroom', 'vital_signs', 'drain', 'humor', 'mood'];
    
    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (patients && patients.length > 0) {
      const validTypes = [];
      
      for (const type of possibleTypes) {
        const testData = {
          patient_id: patients[0].id,
          occurred_at: new Date().toISOString(),
          type: type,
          notes: `Teste de tipo: ${type}`
        };

        const { data: result, error } = await supabase
          .from('events')
          .insert(testData)
          .select()
          .single();

        if (!error) {
          validTypes.push(type);
          // Limpar imediatamente
          await supabase.from('events').delete().eq('id', result.id);
        }
      }

      console.log('✅ Tipos válidos encontrados:', validTypes.join(', '));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar a verificação
checkEventsTableStructure()
  .then(() => {
    console.log('\n🎯 Verificação da estrutura concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });