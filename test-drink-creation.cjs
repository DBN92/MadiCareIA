require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDrinkCreation() {
  console.log('🧪 Testando criação de registro de líquidos...\n')

  try {
    // 1. Verificar tipos de evento disponíveis
    console.log('1. Verificando tipos de evento disponíveis...')
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('type')
      .limit(10)
    
    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError.message)
      return
    }
    
    const uniqueTypes = [...new Set(events.map(e => e.type))]
    console.log('📋 Tipos únicos encontrados:', uniqueTypes)

    // 2. Buscar um paciente para teste
    console.log('\n2. Buscando paciente para teste...')
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(1)
    
    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError.message)
      return
    }
    
    if (!patients || patients.length === 0) {
      console.error('❌ Nenhum paciente encontrado')
      return
    }
    
    const testPatient = patients[0]
    console.log(`✅ Paciente encontrado: ${testPatient.full_name} (ID: ${testPatient.id})`)

    // 3. Tentar criar registro de líquido
    console.log('\n3. Tentando criar registro de líquido...')
    const drinkData = {
      patient_id: testPatient.id,
      type: 'drink',
      volume_ml: 250,
      notes: 'Água - Teste de criação de registro de líquido',
      occurred_at: new Date().toISOString()
    }

    console.log('📝 Dados do registro:', JSON.stringify(drinkData, null, 2))

    const { data: drinkResult, error: drinkError } = await supabase
      .from('events')
      .insert([drinkData])
      .select()
      .single()

    if (drinkError) {
      console.error('❌ Erro ao criar registro de líquido:', drinkError.message)
      console.log('📝 Detalhes do erro:', JSON.stringify(drinkError, null, 2))
      
      // Verificar se é problema de permissão ou schema
      if (drinkError.code === '42501') {
        console.log('🔐 Erro de permissão - verifique as políticas RLS')
      } else if (drinkError.code === '42703') {
        console.log('🗂️ Erro de coluna - verifique se as colunas existem na tabela')
      } else if (drinkError.code === '23503') {
        console.log('🔗 Erro de chave estrangeira - verifique se o patient_id existe')
      }
      return
    }

    console.log('✅ Registro de líquido criado com sucesso!')
    console.log('📋 Dados salvos:', JSON.stringify(drinkResult, null, 2))

    // 4. Verificar se o registro foi salvo corretamente
    console.log('\n4. Verificando registro salvo...')
    const { data: savedEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', drinkResult.id)
      .single()

    if (fetchError) {
      console.error('❌ Erro ao buscar registro salvo:', fetchError.message)
      return
    }

    console.log('✅ Registro encontrado no banco:')
    console.log(`   ID: ${savedEvent.id}`)
    console.log(`   Tipo: ${savedEvent.type}`)
    console.log(`   Volume: ${savedEvent.volume_ml}ml`)
    console.log(`   Horário: ${new Date(savedEvent.occurred_at).toLocaleString('pt-BR')}`)
    console.log(`   Observações: ${savedEvent.notes}`)

    // 5. Limpar dados de teste
    console.log('\n5. Limpando dados de teste...')
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', drinkResult.id)

    if (deleteError) {
      console.error('⚠️ Erro ao limpar dados de teste:', deleteError.message)
    } else {
      console.log('✅ Dados de teste removidos com sucesso')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
    console.log('📝 Stack trace:', error.stack)
  }
}

testDrinkCreation()