const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Usando a chave pública disponível

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSchemaAndMigrateData() {
  console.log('🔄 Iniciando atualização do schema e migração de dados...\n');

  try {
    // 1. Verificar registros existentes com 'mood'
    console.log('1. Verificando registros existentes com tipo "mood"...');
    const { data: moodEvents, error: checkError } = await supabase
      .from('events')
      .select('id, type, created_at')
      .eq('type', 'mood');

    if (checkError) {
      console.error('❌ Erro ao verificar registros:', checkError.message);
      return;
    }

    console.log(`📊 Encontrados ${moodEvents.length} registros com tipo "mood"`);
    if (moodEvents.length > 0) {
      console.log('Primeiros 3 registros:');
      moodEvents.slice(0, 3).forEach(event => {
        console.log(`  - ID: ${event.id}, Tipo: ${event.type}, Data: ${event.created_at}`);
      });
    }

    // 2. Adicionar 'humor' ao enum event_type
    console.log('\n2. Adicionando "humor" ao enum event_type...');
    const { error: enumError } = await supabase.rpc('exec', {
      sql: `ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'humor';`
    });

    if (enumError) {
      console.error('❌ Erro ao adicionar valor ao enum:', enumError.message);
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...');
      
      const { error: altError } = await supabase
        .from('events')
        .select('type')
        .limit(1);
        
      if (altError) {
        console.error('❌ Erro na conexão:', altError.message);
        return;
      }
      
      console.log('✅ Conexão OK, continuando com migração...');
    } else {
      console.log('✅ Enum atualizado com sucesso');
    }

    // 3. Verificar se 'humor' foi adicionado ao enum
    console.log('\n3. Verificando tipos de evento disponíveis...');
    const { data: eventTypes, error: typesError } = await supabase
      .from('events')
      .select('type')
      .limit(100);

    if (typesError) {
      console.error('❌ Erro ao verificar tipos:', typesError.message);
    } else {
      const uniqueTypes = [...new Set(eventTypes.map(e => e.type))];
      console.log('📋 Tipos únicos encontrados:', uniqueTypes);
    }

    // 4. Migrar dados de 'mood' para 'humor' um por vez
    if (moodEvents.length > 0) {
      console.log('\n4. Migrando registros de "mood" para "humor"...');
      let successCount = 0;
      let errorCount = 0;

      for (const event of moodEvents) {
        try {
          const { error: updateError } = await supabase
            .from('events')
            .update({ type: 'humor' })
            .eq('id', event.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar evento ${event.id}:`, updateError.message);
            errorCount++;
          } else {
            successCount++;
            if (successCount % 5 === 0 || successCount === moodEvents.length) {
              console.log(`✅ Migrados ${successCount}/${moodEvents.length} registros`);
            }
          }
        } catch (err) {
          console.error(`❌ Erro inesperado ao atualizar evento ${event.id}:`, err.message);
          errorCount++;
        }
      }

      console.log(`\n📊 Resultado da migração:`);
      console.log(`  - Sucessos: ${successCount}`);
      console.log(`  - Erros: ${errorCount}`);
    }

    // 5. Verificação final
    console.log('\n5. Verificação final...');
    
    const { data: remainingMood, error: finalCheckError } = await supabase
      .from('events')
      .select('id, type')
      .eq('type', 'mood');

    if (finalCheckError) {
      console.error('❌ Erro na verificação final:', finalCheckError.message);
    } else {
      console.log(`📊 Registros restantes com tipo "mood": ${remainingMood.length}`);
    }

    const { data: humorEvents, error: humorCheckError } = await supabase
      .from('events')
      .select('id, type')
      .eq('type', 'humor');

    if (humorCheckError) {
      console.error('❌ Erro ao verificar registros "humor":', humorCheckError.message);
    } else {
      console.log(`📊 Registros com tipo "humor": ${humorEvents.length}`);
    }

    // 6. Verificar tipos únicos finais
    const { data: finalTypes, error: finalTypesError } = await supabase
      .from('events')
      .select('type')
      .limit(1000);

    if (!finalTypesError) {
      const uniqueFinalTypes = [...new Set(finalTypes.map(e => e.type))];
      console.log('📋 Tipos únicos finais:', uniqueFinalTypes.sort());
    }

    console.log('\n✅ Processo de migração concluído!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Verificar se a aplicação está funcionando corretamente');
    console.log('2. Testar a criação de novos eventos do tipo "humor"');
    console.log('3. Verificar se os dados migrados estão sendo exibidos corretamente');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

updateSchemaAndMigrateData();