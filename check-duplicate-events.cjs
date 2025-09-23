const { createClient } = require('@supabase/supabase-js');

// Configurações de produção
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicateEvents() {
  console.log('🔍 VERIFICANDO EVENTOS DUPLICADOS');
  console.log('==========================================');
  
  try {
    // 1. Buscar todos os eventos ordenados por data
    console.log('\n1. Buscando todos os eventos...');
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar eventos:', error.message);
      return;
    }
    
    console.log(`📊 Total de eventos encontrados: ${events.length}`);
    
    // 2. Agrupar eventos por características similares
    console.log('\n2. Analisando possíveis duplicatas...');
    
    const duplicateGroups = {};
    
    events.forEach(event => {
      // Criar uma chave baseada em características que indicam duplicação
      const key = `${event.patient_id}_${event.type}_${event.occurred_at}_${event.med_name || ''}_${event.meal_desc || ''}_${event.bathroom_type || ''}_${event.volume_ml || ''}`;
      
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(event);
    });
    
    // 3. Identificar grupos com mais de 1 evento (possíveis duplicatas)
    const duplicates = Object.values(duplicateGroups).filter(group => group.length > 1);
    
    console.log(`🔍 Grupos de possíveis duplicatas encontrados: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\n📋 EVENTOS DUPLICADOS DETECTADOS:');
      console.log('==========================================');
      
      duplicates.forEach((group, index) => {
        console.log(`\n🔸 Grupo ${index + 1} (${group.length} eventos):`);
        group.forEach((event, eventIndex) => {
          const createdAt = new Date(event.created_at).toLocaleString('pt-BR');
          const occurredAt = new Date(event.occurred_at).toLocaleString('pt-BR');
          console.log(`   ${eventIndex + 1}. ID: ${event.id}`);
          console.log(`      Tipo: ${event.type}`);
          console.log(`      Ocorrido em: ${occurredAt}`);
          console.log(`      Criado em: ${createdAt}`);
          if (event.med_name) console.log(`      Medicamento: ${event.med_name} - ${event.med_dose}`);
          if (event.meal_desc) console.log(`      Refeição: ${event.meal_desc}`);
          if (event.bathroom_type) console.log(`      Banheiro: ${event.bathroom_type}`);
          if (event.volume_ml) console.log(`      Volume: ${event.volume_ml}ml`);
          if (event.notes) console.log(`      Notas: ${event.notes}`);
          console.log('      ---');
        });
      });
      
      // 4. Calcular estatísticas de duplicação
      const totalDuplicates = duplicates.reduce((sum, group) => sum + group.length - 1, 0);
      console.log(`\n📊 ESTATÍSTICAS:`);
      console.log(`   • Total de eventos: ${events.length}`);
      console.log(`   • Eventos únicos: ${events.length - totalDuplicates}`);
      console.log(`   • Eventos duplicados: ${totalDuplicates}`);
      console.log(`   • Grupos de duplicatas: ${duplicates.length}`);
      
    } else {
      console.log('\n✅ Nenhuma duplicata detectada!');
    }
    
    // 5. Verificar eventos muito próximos no tempo (possível double-click)
    console.log('\n3. Verificando eventos muito próximos no tempo...');
    
    const timeBasedDuplicates = [];
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      if (current.patient_id === next.patient_id && 
          current.type === next.type) {
        
        const timeDiff = Math.abs(new Date(current.created_at) - new Date(next.created_at));
        const timeDiffSeconds = timeDiff / 1000;
        
        // Se foram criados com menos de 5 segundos de diferença
        if (timeDiffSeconds < 5) {
          timeBasedDuplicates.push({
            event1: current,
            event2: next,
            timeDiff: timeDiffSeconds
          });
        }
      }
    }
    
    if (timeBasedDuplicates.length > 0) {
      console.log(`\n⚠️  Eventos suspeitos (criados com <5s de diferença): ${timeBasedDuplicates.length}`);
      timeBasedDuplicates.forEach((pair, index) => {
        console.log(`\n🔸 Par suspeito ${index + 1}:`);
        console.log(`   Evento 1: ${pair.event1.id} - ${new Date(pair.event1.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Evento 2: ${pair.event2.id} - ${new Date(pair.event2.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Diferença: ${pair.timeDiff.toFixed(2)} segundos`);
      });
    } else {
      console.log('✅ Nenhum evento suspeito de double-click encontrado');
    }
    
    console.log('\n🎉 ANÁLISE CONCLUÍDA!');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkDuplicateEvents();
