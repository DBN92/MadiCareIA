const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMoodToHumor() {
  console.log('🔄 Atualizando registros de "mood" para "humor"...\n');
  
  try {
    // 1. Verificar registros existentes com type = 'mood'
    console.log('🔍 Verificando registros existentes com type = "mood"...');
    const { data: moodEvents, error: fetchError } = await supabase
      .from('events')
      .select('id, type, mood_scale, happiness_scale, mood_notes, created_at')
      .eq('type', 'mood');
      
    if (fetchError) {
      console.error('❌ Erro ao buscar eventos de mood:', fetchError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${moodEvents?.length || 0} registros com type = "mood"`);
    
    if (moodEvents && moodEvents.length > 0) {
      console.log('\n📋 Registros encontrados:');
      moodEvents.forEach((event, index) => {
        console.log(`${index + 1}. ID: ${event.id} | Humor: ${event.mood_scale}/5 | Felicidade: ${event.happiness_scale}/5`);
        if (event.mood_notes) {
          console.log(`   Notas: ${event.mood_notes}`);
        }
      });
      
      // 2. Atualizar type de 'mood' para 'humor'
      console.log('\n🔄 Atualizando type de "mood" para "humor"...');
      const { data: updatedEvents, error: updateError } = await supabase
        .from('events')
        .update({ type: 'humor' })
        .eq('type', 'mood')
        .select();
        
      if (updateError) {
        console.error('❌ Erro ao atualizar eventos:', updateError.message);
      } else {
        console.log(`✅ ${updatedEvents?.length || 0} registros atualizados de "mood" para "humor"`);
      }
    } else {
      console.log('ℹ️ Nenhum registro com type = "mood" encontrado');
    }
    
    // 3. Verificar se o enum event_type precisa ser atualizado
    console.log('\n🔍 Verificando tipos de eventos únicos...');
    const { data: eventTypes, error: typesError } = await supabase
      .from('events')
      .select('type')
      .not('type', 'is', null);
      
    if (!typesError && eventTypes) {
      const uniqueTypes = [...new Set(eventTypes.map(e => e.type))];
      console.log('📋 Tipos de eventos atuais:', uniqueTypes.join(', '));
      
      if (uniqueTypes.includes('humor')) {
        console.log('✅ Tipo "humor" encontrado na base de dados');
      }
      if (uniqueTypes.includes('mood')) {
        console.log('⚠️ Ainda existem registros com tipo "mood"');
      }
    }
    
    // 4. Verificar resultado final
    console.log('\n🔍 Verificação final...');
    const { data: humorEvents, error: humorError } = await supabase
      .from('events')
      .select('id, type, mood_scale, happiness_scale, mood_notes')
      .eq('type', 'humor');
      
    if (!humorError) {
      console.log(`✅ Total de registros com type = "humor": ${humorEvents?.length || 0}`);
    }
    
    const { data: remainingMood, error: remainingError } = await supabase
      .from('events')
      .select('id')
      .eq('type', 'mood');
      
    if (!remainingError) {
      console.log(`📊 Registros restantes com type = "mood": ${remainingMood?.length || 0}`);
    }
    
    console.log('\n🎉 Atualização da base de dados concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Atualizar o código da aplicação para usar "humor" ao invés de "mood"');
    console.log('2. Atualizar o enum event_type no schema do Supabase');
    console.log('3. Testar a aplicação para garantir compatibilidade');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
updateMoodToHumor();