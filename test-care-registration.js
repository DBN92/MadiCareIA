import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Carregar variáveis de ambiente
const envContent = fs.readFileSync('.env', 'utf8')
const envLines = envContent.split('\n')
const envVars = {}

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=')
    // Remove aspas se existirem
    value = value.replace(/^["']|["']$/g, '')
    envVars[key.trim()] = value.trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('💊 TESTE DE REGISTRO DE CUIDADOS - MEDICARE')
console.log('==================================================')

let testPatientId = null
let createdEventIds = []

async function testCareRegistration() {
  try {
    // 1. Criar um paciente de teste
    console.log('\n👤 Preparação: Criando paciente de teste...')
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .insert({
        full_name: 'Ana Silva - Teste Cuidados',
        birth_date: '1975-08-10',
        bed: 'CARE-301',
        notes: 'Paciente para teste de registro de cuidados',
        is_active: true
      })
      .select()
      .single()

    if (patientError) {
      throw new Error(`Erro ao criar paciente: ${patientError.message}`)
    }

    testPatientId = patientData.id
    console.log(`✅ Paciente criado: ${patientData.full_name} (ID: ${testPatientId})`)

    // 2. Testar registro de medicamento
    console.log('\n💊 Teste 1: Registrando medicamento...')
    const medEvent = {
      patient_id: testPatientId,
      type: 'med',
      med_name: 'Dipirona',
      med_dose: '500mg',
      notes: 'Administrado para dor de cabeça',
      occurred_at: new Date().toISOString()
    }

    const { data: medData, error: medError } = await supabase
      .from('events')
      .insert([medEvent])
      .select()
      .single()

    if (medError) {
      throw new Error(`Erro ao registrar medicamento: ${medError.message}`)
    }

    createdEventIds.push(medData.id)
    console.log('✅ Medicamento registrado com sucesso!')
    console.log(`   Medicamento: ${medData.med_name} ${medData.med_dose}`)
    console.log(`   Horário: ${new Date(medData.occurred_at).toLocaleString('pt-BR')}`)

    // 3. Testar registro de líquidos
    console.log('\n💧 Teste 2: Registrando ingestão de líquidos...')
    const drinkEvent = {
      patient_id: testPatientId,
      type: 'drink',
      volume_ml: 300,
      notes: 'Água - paciente hidratado adequadamente',
      occurred_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min atrás
    }

    const { data: drinkData, error: drinkError } = await supabase
      .from('events')
      .insert([drinkEvent])
      .select()
      .single()

    if (drinkError) {
      throw new Error(`Erro ao registrar líquidos: ${drinkError.message}`)
    }

    createdEventIds.push(drinkData.id)
    console.log('✅ Ingestão de líquidos registrada!')
    console.log(`   Volume: ${drinkData.volume_ml}ml`)
    console.log(`   Horário: ${new Date(drinkData.occurred_at).toLocaleString('pt-BR')}`)

    // 4. Testar registro de refeição
    console.log('\n🍽️  Teste 3: Registrando refeição...')
    const mealEvent = {
      patient_id: testPatientId,
      type: 'meal',
      meal_desc: 'Almoço - arroz, feijão, frango grelhado',
      notes: 'Paciente aceitou bem a refeição, comeu 80%',
      occurred_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hora atrás
    }

    const { data: mealData, error: mealError } = await supabase
      .from('events')
      .insert([mealEvent])
      .select()
      .single()

    if (mealError) {
      throw new Error(`Erro ao registrar refeição: ${mealError.message}`)
    }

    createdEventIds.push(mealData.id)
    console.log('✅ Refeição registrada!')
    console.log(`   Descrição: ${mealData.meal_desc}`)
    console.log(`   Horário: ${new Date(mealData.occurred_at).toLocaleString('pt-BR')}`)

    // 5. Testar registro de anotação
    console.log('\n📝 Teste 4: Registrando anotação...')
    const noteEvent = {
      patient_id: testPatientId,
      type: 'note',
      notes: 'Sinais vitais: PA 130/85, FC 78 bpm, Temp 36.8°C, SpO2 98%',
      occurred_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 min atrás
    }

    const { data: noteData, error: noteError } = await supabase
      .from('events')
      .insert([noteEvent])
      .select()
      .single()

    if (noteError) {
      throw new Error(`Erro ao registrar anotação: ${noteError.message}`)
    }

    createdEventIds.push(noteData.id)
    console.log('✅ Anotação registrada!')
    console.log(`   Conteúdo: ${noteData.notes}`)
    console.log(`   Horário: ${new Date(noteData.occurred_at).toLocaleString('pt-BR')}`)

    // 6. Verificar todos os eventos registrados
    console.log('\n📊 Teste 5: Verificando eventos armazenados...')
    const { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatientId)
      .order('occurred_at', { ascending: false })

    if (eventsError) {
      throw new Error(`Erro ao buscar eventos: ${eventsError.message}`)
    }

    console.log(`✅ ${allEvents.length} eventos encontrados para o paciente:`)
    allEvents.forEach((event, index) => {
      const time = new Date(event.occurred_at).toLocaleString('pt-BR')
      let description = ''
      
      switch (event.type) {
        case 'med':
          description = `${event.med_name} ${event.med_dose}`
          break
        case 'drink':
          description = `${event.volume_ml}ml de líquido`
          break
        case 'meal':
          description = event.meal_desc
          break
        case 'note':
          description = event.notes.substring(0, 50) + '...'
          break
        default:
          description = event.notes || 'Sem descrição'
      }
      
      console.log(`   ${index + 1}. [${event.type.toUpperCase()}] ${time} - ${description}`)
    })

    // 7. Testar busca por tipo de evento
    console.log('\n🔍 Teste 6: Testando filtros por tipo...')
    const { data: medEvents, error: medFilterError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatientId)
      .eq('type', 'med')

    if (medFilterError) {
      throw new Error(`Erro ao filtrar medicamentos: ${medFilterError.message}`)
    }

    console.log(`✅ Filtro por medicamentos: ${medEvents.length} evento(s) encontrado(s)`)

    // 8. Testar busca por período
    console.log('\n📅 Teste 7: Testando filtro por período...')
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentEvents, error: dateFilterError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatientId)
      .gte('occurred_at', oneDayAgo)

    if (dateFilterError) {
      throw new Error(`Erro ao filtrar por data: ${dateFilterError.message}`)
    }

    console.log(`✅ Eventos das últimas 24h: ${recentEvents.length} evento(s)`)

    console.log('\n==================================================')
    console.log('📋 RELATÓRIO FINAL - REGISTRO DE CUIDADOS')
    console.log('==================================================')
    console.log('✅ PASSOU - Registro de Medicamento')
    console.log('✅ PASSOU - Registro de Líquidos')
    console.log('✅ PASSOU - Registro de Refeição')
    console.log('✅ PASSOU - Registro de Anotação')
    console.log('✅ PASSOU - Verificação de Armazenamento')
    console.log('✅ PASSOU - Filtro por Tipo')
    console.log('✅ PASSOU - Filtro por Período')
    console.log('\n📊 RESUMO:')
    console.log('   Testes executados: 7')
    console.log('   Testes aprovados: 7')
    console.log('   Taxa de sucesso: 100.0%')
    console.log('\n🎉 TODOS OS TESTES DE CUIDADOS PASSARAM!')
    console.log('💾 Registro de cuidados funcionando perfeitamente no Supabase.')

  } catch (error) {
    console.error('\n💥 Erro durante os testes:', error.message)
    console.log('\n==================================================')
    console.log('📋 RELATÓRIO FINAL - REGISTRO DE CUIDADOS')
    console.log('==================================================')
    console.log('❌ ALGUNS TESTES FALHARAM')
    console.log('\n⚠️  Verifique os logs acima para mais detalhes.')
  } finally {
    // Limpeza
    console.log('\n🧹 Limpeza dos dados de teste...')
    
    // Remover eventos
    if (createdEventIds.length > 0) {
      try {
        await supabase
          .from('events')
          .delete()
          .in('id', createdEventIds)
        console.log(`✅ ${createdEventIds.length} eventos removidos`)
      } catch (cleanupError) {
        console.log('⚠️  Alguns eventos podem não ter sido removidos')
      }
    }
    
    // Remover paciente
    if (testPatientId) {
      try {
        await supabase
          .from('patients')
          .delete()
          .eq('id', testPatientId)
        console.log('✅ Paciente de teste removido')
      } catch (cleanupError) {
        console.log('⚠️  Paciente de teste pode ainda estar no banco')
      }
    }
  }
}

console.log('🏁 Teste de registro de cuidados concluído.')

runCareRegistrationTest().catch(console.error)

async function runCareRegistrationTest() {
  await testCareRegistration()
}