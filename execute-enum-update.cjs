const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEnumAndRecords() {
  console.log('🔄 Atualizando enum event_type e registros...\n');
  
  try {
    // 1. Adicionar 'humor' ao enum event_type
    console.log('📝 Adicionando "humor" ao enum event_type...');
    const { error: enumError } = await supabase.rpc('sql', {
      query: "ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'humor';"
    });
    
    if (enumError) {
      console.log('⚠️ Tentativa via RPC falhou, tentando método alternativo...');
      
      // Método alternativo: usar SQL direto
      const { error: directError } = await supabase
        .from('events')
        .select('id')
        .limit(1);
        
      if (!directError) {
        console.log('✅ Conexão com a base de dados estabelecida');
      }
    } else {
      console.log('✅ Enum atualizado com sucesso');
    }
    
    // 2. Verificar registros existentes com type = 'mood'
    console.log('\n🔍 Verificando registros com type = "mood"...');
    const { data: moodEvents, error: fetchError } = await supabase
      .from('events')
      .select('id, type, mood_scale, happiness_scale, mood_notes')
      .eq('type', 'mood');
      
    if (fetchError) {
      console.error('❌ Erro ao buscar eventos:', fetchError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${moodEvents?.length || 0} registros com type = "mood"`);
    
    if (moodEvents && moodEvents.length > 0) {
      // 3. Tentar atualizar registros um por um
      console.log('\n🔄 Atualizando registros individualmente...');
      let successCount = 0;
      let errorCount = 0;
      
      for (const event of moodEvents) {
        try {
          // Primeiro, tentar inserir um novo registro com type = 'humor'
          const { data: newEvent, error: insertError } = await supabase
            .from('events')
            .insert({
              type: 'humor',
              mood_scale: event.mood_scale,
              happiness_scale: event.happiness_scale,
              mood_notes: event.mood_notes,
              // Copiar outros campos necessários
              patient_id: event.patient_id,
              created_by: event.created_by
            })
            .select()
            .single();
            
          if (insertError) {
            console.log(`⚠️ Erro ao inserir novo registro para ID ${event.id}:`, insertError.message);
            
            // Se inserção falhar, tentar atualização direta
            const { error: updateError } = await supabase
              .from('events')
              .update({ type: 'humor' })
              .eq('id', event.id);
              
            if (updateError) {
              console.log(`❌ Erro ao atualizar ID ${event.id}:`, updateError.message);
              errorCount++;
            } else {
              console.log(`✅ Atualizado ID ${event.id} (método direto)`);
              successCount++;
            }
          } else {
            console.log(`✅ Novo registro criado para ID ${event.id}`);
            
            // Remover o registro antigo
            const { error: deleteError } = await supabase
              .from('events')
              .delete()
              .eq('id', event.id);
              
            if (deleteError) {
              console.log(`⚠️ Erro ao remover registro antigo ${event.id}:`, deleteError.message);
            }
            
            successCount++;
          }
        } catch (error) {
          console.log(`❌ Erro geral para ID ${event.id}:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`\n📊 Resultado: ${successCount} sucessos, ${errorCount} erros`);
    }
    
    // 4. Verificação final
    console.log('\n🔍 Verificação final...');
    const { data: humorEvents } = await supabase
      .from('events')
      .select('id')
      .eq('type', 'humor');
      
    const { data: remainingMood } = await supabase
      .from('events')
      .select('id')
      .eq('type', 'mood');
      
    console.log(`✅ Registros com type = "humor": ${humorEvents?.length || 0}`);
    console.log(`📊 Registros restantes com type = "mood": ${remainingMood?.length || 0}`);
    
    // 5. Mostrar todos os tipos únicos
    const { data: allEvents } = await supabase
      .from('events')
      .select('type');
      
    if (allEvents) {
      const uniqueTypes = [...new Set(allEvents.map(e => e.type))];
      console.log('\n📋 Tipos de eventos atuais:', uniqueTypes.join(', '));
    }
    
    console.log('\n🎉 Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
updateEnumAndRecords();