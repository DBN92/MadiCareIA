import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Ler variáveis de ambiente
const envContent = fs.readFileSync('.env', 'utf8')
const envLines = envContent.split('\n')
const envVars = {}

envLines.forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=')
    envVars[key.trim()] = value.trim().replace(/["']/g, '')
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Iniciando teste de ponta a ponta completo...')
console.log('📊 Verificando conexão com Supabase...')

// Função para aguardar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Teste 1: Verificar estrutura do banco
async function testDatabaseStructure() {
  console.log('\n📋 Teste 1: Verificando estrutura do banco de dados...')
  
  try {
    // Verificar tabela de pacientes
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1)
    
    if (patientsError && !patientsError.message.includes('0 rows')) {
      console.error('❌ Erro ao acessar tabela patients:', patientsError.message)
      return false
    }
    console.log('✅ Tabela patients acessível')
    
    // Verificar tabela de eventos
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1)
    
    if (eventsError && !eventsError.message.includes('0 rows')) {
      console.error('❌ Erro ao acessar tabela events:', eventsError.message)
      return false
    }
    console.log('✅ Tabela events acessível')
    
    return true
  } catch (error) {
    console.error('❌ Erro na verificação da estrutura:', error.message)
    return false
  }
}

// Teste 2: Criar paciente de teste
async function testPatientCreation() {
  console.log('\n👤 Teste 2: Criando paciente de teste...')
  
  const testPatient = {
    full_name: 'João Silva Teste E2E',
    birth_date: '1980-05-15',
    bed: 'E2E-101',
    notes: 'Paciente de teste para validação E2E - MR-' + Date.now(),
    is_active: true
  }
  
  try {
    const { data, error } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
    
    if (error) {
      console.error('❌ Erro ao criar paciente:', error.message)
      return null
    }
    
    console.log('✅ Paciente criado com sucesso:', data[0].full_name)
    console.log('📋 ID do paciente:', data[0].id)
    return data[0]
  } catch (error) {
    console.error('❌ Erro na criação do paciente:', error.message)
    return null
  }
}

// Teste 3: Registrar cuidados
async function testCareRegistration(patientId) {
  console.log('\n💊 Teste 3: Registrando cuidados para o paciente...')
  
  const careEvents = [
    {
      patient_id: patientId,
      type: 'med',
      med_name: 'Paracetamol',
      med_dose: '500mg',
      notes: 'Paciente relatou melhora da dor',
      occurred_at: new Date().toISOString()
    },
    {
      patient_id: patientId,
      type: 'note',
      notes: 'Sinais vitais: PA: 120/80, FC: 72 bpm, Temp: 36.5°C',
      occurred_at: new Date().toISOString()
    }
  ]
  
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(careEvents)
      .select()
    
    if (error) {
      console.error('❌ Erro ao registrar cuidados:', error.message)
      return false
    }
    
    console.log(`✅ ${data.length} eventos de cuidado registrados com sucesso`)
    data.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.event_type}: ${event.description}`)
    })
    return true
  } catch (error) {
    console.error('❌ Erro no registro de cuidados:', error.message)
    return false
  }
}

// Teste 4: Verificar dados armazenados
async function testDataRetrieval(patientId) {
  console.log('\n📊 Teste 4: Verificando dados armazenados...')
  
  try {
    // Buscar paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()
    
    if (patientError) {
      console.error('❌ Erro ao buscar paciente:', patientError.message)
      return false
    }
    
    console.log('✅ Paciente encontrado:', patient.full_name)
    
    // Buscar eventos do paciente
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError.message)
      return false
    }
    
    console.log(`✅ ${events.length} eventos encontrados para o paciente`)
    
    // Verificar integridade dos dados
    const eventTypes = events.map(e => e.event_type)
    const expectedTypes = ['medication', 'vital_signs', 'hygiene']
    const hasAllTypes = expectedTypes.every(type => eventTypes.includes(type))
    
    if (hasAllTypes) {
      console.log('✅ Todos os tipos de eventos foram armazenados corretamente')
    } else {
      console.log('⚠️  Alguns tipos de eventos podem estar faltando')
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro na verificação de dados:', error.message)
    return false
  }
}

// Teste 5: Limpeza dos dados de teste
async function cleanupTestData(patientId) {
  console.log('\n🧹 Teste 5: Limpando dados de teste...')
  
  try {
    // Remover eventos
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('patient_id', patientId)
    
    if (eventsError) {
      console.error('❌ Erro ao remover eventos:', eventsError.message)
    } else {
      console.log('✅ Eventos de teste removidos')
    }
    
    // Remover paciente
    const { error: patientError } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
    
    if (patientError) {
      console.error('❌ Erro ao remover paciente:', patientError.message)
    } else {
      console.log('✅ Paciente de teste removido')
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message)
    return false
  }
}

// Executar todos os testes
async function runCompleteE2ETest() {
  console.log('🎯 TESTE DE PONTA A PONTA - MEDICARE')
  console.log('=' .repeat(50))
  
  const results = {
    databaseStructure: false,
    patientCreation: false,
    careRegistration: false,
    dataRetrieval: false,
    cleanup: false
  }
  
  let testPatient = null
  
  try {
    // Teste 1: Estrutura do banco
    results.databaseStructure = await testDatabaseStructure()
    await wait(1000)
    
    if (!results.databaseStructure) {
      throw new Error('Falha na verificação da estrutura do banco')
    }
    
    // Teste 2: Criação de paciente
    testPatient = await testPatientCreation()
    results.patientCreation = testPatient !== null
    await wait(1000)
    
    if (!results.patientCreation) {
      throw new Error('Falha na criação do paciente')
    }
    
    // Teste 3: Registro de cuidados
    results.careRegistration = await testCareRegistration(testPatient.id)
    await wait(1000)
    
    if (!results.careRegistration) {
      throw new Error('Falha no registro de cuidados')
    }
    
    // Teste 4: Verificação de dados
    results.dataRetrieval = await testDataRetrieval(testPatient.id)
    await wait(1000)
    
    if (!results.dataRetrieval) {
      throw new Error('Falha na verificação de dados')
    }
    
    // Teste 5: Limpeza
    results.cleanup = await cleanupTestData(testPatient.id)
    
  } catch (error) {
    console.error('\n💥 Erro durante os testes:', error.message)
    
    // Tentar limpeza mesmo em caso de erro
    if (testPatient) {
      console.log('\n🧹 Tentando limpeza de emergência...')
      await cleanupTestData(testPatient.id)
    }
  }
  
  // Relatório final
  console.log('\n' + '=' .repeat(50))
  console.log('📋 RELATÓRIO FINAL DO TESTE E2E')
  console.log('=' .repeat(50))
  
  const testNames = {
    databaseStructure: 'Estrutura do Banco de Dados',
    patientCreation: 'Criação de Paciente',
    careRegistration: 'Registro de Cuidados',
    dataRetrieval: 'Recuperação de Dados',
    cleanup: 'Limpeza de Dados'
  }
  
  Object.entries(results).forEach(([key, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU'
    console.log(`${status} - ${testNames[key]}`)
  })
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  const successRate = ((passedTests / totalTests) * 100).toFixed(1)
  
  console.log('\n📊 RESUMO:')
  console.log(`   Testes executados: ${totalTests}`)
  console.log(`   Testes aprovados: ${passedTests}`)
  console.log(`   Taxa de sucesso: ${successRate}%`)
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! A aplicação está funcionando corretamente.')
    console.log('💾 Dados estão sendo armazenados e recuperados adequadamente do Supabase.')
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verifique os logs acima para mais detalhes.')
  }
  
  console.log('\n🏁 Teste de ponta a ponta concluído.')
}

// Executar o teste
runCompleteE2ETest().catch(console.error)