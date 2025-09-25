const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCareFormData() {
  console.log('🧪 Testando dados estruturados pelo CareForm...\n');

  try {
    // Buscar um paciente para teste
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(1);

    if (patientsError || !patients || patients.length === 0) {
      console.error('❌ Erro ao buscar pacientes:', patientsError?.message || 'Nenhum paciente encontrado');
      return;
    }

    const testPatientId = patients[0].id;
    console.log(`✅ Usando paciente: ${patients[0].full_name} (ID: ${testPatientId})`);

    // Testar diferentes tipos de eventos como o CareForm estrutura
    const testEvents = [
      {
        name: 'Líquidos (drink)',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: "drink",
          volume_ml: 250,
          liquid_type: "water",
          notes: "Teste de líquidos"
        }
      },
      {
        name: 'Refeição (meal)',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: "meal",
          meal_type: "lunch",
          consumption_percentage: 80,
          meal_desc: "Almoço completo",
          notes: "Almoço completo"
        }
      },
      {
        name: 'Medicamento (medication)',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: "medication",
          medication_name: "Paracetamol",
          dosage: "500mg",
          route: "oral",
          notes: "Medicamento para dor"
        }
      },
      {
        name: 'Dreno (drain)',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: "drain",
          drain_type: "chest",
          left_amount: 100,
          right_amount: 150,
          left_aspect: "clear",
          right_aspect: "bloody",
          notes: "Drenagem torácica"
        }
      },
      {
        name: 'Banheiro (bathroom)',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: "bathroom",
          bathroom_type: "urine",
          volume_ml: 300,
          notes: "Eliminação urinária"
        }
      },
      {
        name: 'Sinais Vitais (vital_signs)',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: "vital_signs",
          systolic_bp: 120,
          diastolic_bp: 80,
          heart_rate: 72,
          temperature: 36.5,
          oxygen_saturation: 98,
          respiratory_rate: 16,
          notes: "Sinais vitais normais"
        }
      },
      {
        name: 'Humor (humor)',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: "humor",
          mood_scale: 7,
          happiness_scale: 8,
          mood_notes: "Paciente animado",
          notes: "Paciente animado"
        }
      }
    ];

    const insertedIds = [];

    for (const testEvent of testEvents) {
      console.log(`\n💉 Testando: ${testEvent.name}`);
      console.log('📝 Dados:', JSON.stringify(testEvent.data, null, 2));

      try {
        const { data: result, error: insertError } = await supabase
          .from('events')
          .insert(testEvent.data)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ ERRO em ${testEvent.name}:`, insertError.message);
          console.error('📋 Detalhes:', JSON.stringify(insertError, null, 2));
        } else {
          console.log(`✅ ${testEvent.name} inserido com sucesso! ID: ${result.id}`);
          insertedIds.push(result.id);
        }
      } catch (error) {
        console.error(`❌ Erro geral em ${testEvent.name}:`, error.message);
      }
    }

    // Verificar se os eventos foram salvos
    if (insertedIds.length > 0) {
      console.log(`\n🔍 Verificando ${insertedIds.length} eventos salvos...`);
      
      const { data: savedEvents, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .in('id', insertedIds)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Erro ao verificar eventos salvos:', fetchError.message);
      } else {
        console.log(`✅ ${savedEvents.length} eventos confirmados na base de dados!`);
        
        savedEvents.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.type} - ${event.notes || 'Sem notas'} (${event.occurred_at})`);
        });

        // Limpar eventos de teste
        console.log('\n🧹 Limpando eventos de teste...');
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .in('id', insertedIds);

        if (deleteError) {
          console.log('⚠️ Aviso: Não foi possível remover todos os eventos de teste:', deleteError.message);
        } else {
          console.log('✅ Eventos de teste removidos com sucesso.');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    console.error('📋 Stack trace:', error.stack);
  }
}

// Executar o teste
testCareFormData()
  .then(() => {
    console.log('\n🎯 Teste de dados do CareForm concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });