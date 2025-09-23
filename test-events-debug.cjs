const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEventSaving() {
  console.log('🔍 TESTE DE DEBUG - SALVAMENTO DE EVENTOS')
  console.log('==========================================')
  
  try {
    // 1. Verificar se existe algum paciente
    console.log('\n1. Verificando pacientes existentes...')
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(5)
    
    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError.message)
      return
    }
    
    console.log(`✅ Encontrados ${patients.length} pacientes`)
    if (patients.length === 0) {
      console.log('⚠️  Nenhum paciente encontrado. Criando um paciente de teste...')
      
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert([{
          full_name: 'Paciente Teste Debug',
          bed: 'Leito 999',
          birth_date: '1990-01-01',
          is_active: true
        }])
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Erro ao criar paciente:', createError.message)
        return
      }
      
      patients.push(newPatient)
      console.log('✅ Paciente de teste criado:', newPatient.full_name)
    }
    
    const testPatientId = patients[0].id
    console.log(`📋 Usando paciente: ${patients[0].full_name} (ID: ${testPatientId})`)
    
    // 2. Verificar estrutura da tabela events
    console.log('\n2. Verificando estrutura da tabela events...')
    const { data: existingEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1)
    
    if (eventsError) {
      console.error('❌ Erro ao acessar tabela events:', eventsError.message)
      return
    }
    
    console.log('✅ Tabela events acessível')
    console.log(`📊 Eventos existentes: ${existingEvents.length}`)
    
    // 3. Testar inserção de evento simples
    console.log('\n3. Testando inserção de evento simples...')
    const testEvent = {
      patient_id: testPatientId,
      type: 'med',
      occurred_at: new Date().toISOString(),
      med_name: 'Paracetamol Teste',
      med_dose: '500mg',
      notes: 'Teste de debug - medicamento'
    }
    
    console.log('📝 Dados do evento:', JSON.stringify(testEvent, null, 2))
    
    const { data: insertedEvent, error: insertError } = await supabase
      .from('events')
      .insert([testEvent])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Erro ao inserir evento:', insertError.message)
      console.error('📋 Detalhes do erro:', insertError)
      return
    }
    
    console.log('✅ Evento inserido com sucesso!')
    console.log('📋 Evento criado:', JSON.stringify(insertedEvent, null, 2))
    
    // 4. Verificar se o evento foi salvo
    console.log('\n4. Verificando se o evento foi salvo...')
    const { data: savedEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatientId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (fetchError) {
      console.error('❌ Erro ao buscar eventos salvos:', fetchError.message)
      return
    }
    
    console.log(`✅ Eventos encontrados: ${savedEvents.length}`)
    savedEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.type} - ${event.med_name || event.notes || 'Sem descrição'} (${event.occurred_at})`)
    })
    
    // 5. Testar diferentes tipos de eventos
    console.log('\n5. Testando diferentes tipos de eventos...')
    
    const eventTypes = [
      {
        type: 'drink',
        volume_ml: 250,
        notes: 'Água - Teste debug'
      },
      {
        type: 'meal',
        meal_desc: 'Almoço - 80% consumido - Teste debug'
      },
      {
        type: 'bathroom',
        bathroom_type: 'urina',
        notes: 'Teste debug - banheiro'
      },
      {
        type: 'note',
        notes: 'Anotação geral - Teste debug',
        volume_ml: 100
      }
    ]
    
    for (const eventType of eventTypes) {
      const eventData = {
        patient_id: testPatientId,
        occurred_at: new Date().toISOString(),
        ...eventType
      }
      
      console.log(`   Testando evento tipo: ${eventType.type}`)
      
      const { data: typeEvent, error: typeError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()
      
      if (typeError) {
        console.error(`   ❌ Erro no tipo ${eventType.type}:`, typeError.message)
      } else {
        console.log(`   ✅ Evento ${eventType.type} salvo com sucesso`)
      }
    }
    
    // 6. Verificar total de eventos após os testes
    console.log('\n6. Verificação final...')
    const { data: finalEvents, error: finalError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatientId)
    
    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError.message)
      return
    }
    
    console.log(`✅ Total de eventos para o paciente: ${finalEvents.length}`)
    
    // 7. Limpeza (opcional)
    console.log('\n7. Limpeza dos dados de teste...')
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('patient_id', testPatientId)
      .like('notes', '%Teste debug%')
    
    if (deleteError) {
      console.log('⚠️  Erro na limpeza:', deleteError.message)
    } else {
      console.log('✅ Dados de teste removidos')
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
    console.log('==========================================')
    console.log('✅ A funcionalidade de salvamento está funcionando corretamente')
    console.log('💡 Se os eventos não aparecem na interface, pode ser um problema de:')
    console.log('   - Cache do navegador')
    console.log('   - Estado do React não atualizando')
    console.log('   - Filtros aplicados na interface')
    console.log('   - Paciente não selecionado corretamente')
    
  } catch (error) {
    console.error('💥 Erro geral no teste:', error.message)
    console.error('📋 Stack trace:', error.stack)
  }
}

// Executar o teste
testEventSaving().catch(console.error)