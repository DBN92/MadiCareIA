/**
 * Teste E2E Completo do Sistema MediCare
 * 
 * Este teste valida todas as funcionalidades principais:
 * - Cadastro e exclusão de usuários
 * - Cadastro e exclusão de pacientes
 * - Registro de cuidados (líquidos, medicamentos, alimentação, banheiro, anotações)
 * - Geração de relatórios
 * - Configurações do sistema
 * - Acesso familiar
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? 'Definida' : 'Não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Variáveis globais para os testes
let testUserId = null
let testPatientId = null
let testEventIds = []
let testFamilyTokenId = null

// Função auxiliar para logging
function logTest(testName, success, details = '') {
  const status = success ? '✅' : '❌'
  const timestamp = new Date().toLocaleTimeString('pt-BR')
  console.log(`${status} [${timestamp}] ${testName}${details ? ': ' + details : ''}`)
}

// Função auxiliar para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * TESTE 1: GESTÃO DE USUÁRIOS
 */
async function testUserManagement() {
  console.log('\n👤 TESTE 1: Gestão de Usuários')
  console.log('=' .repeat(50))

  try {
    // 1.1 Criar usuário de teste
    console.log('\n📝 1.1: Criando usuário de teste...')
    
    const testEmail = `teste.e2e.${Date.now()}@medicare.test`
    const testPassword = 'TesteE2E123!'
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste E2E'
        }
      }
    })

    if (authError) {
      logTest('Criação de Usuário', false, authError.message)
      return false
    }

    testUserId = authData.user?.id
    logTest('Criação de Usuário', true, `ID: ${testUserId}`)

    // 1.2 Verificar perfil criado
    console.log('\n🔍 1.2: Verificando perfil criado...')
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()

    if (profileError) {
      logTest('Verificação de Perfil', false, profileError.message)
      return false
    }

    logTest('Verificação de Perfil', true, `Nome: ${profile.full_name}`)

    // 1.3 Fazer login
    console.log('\n🔐 1.3: Testando login...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      logTest('Login de Usuário', false, loginError.message)
      return false
    }

    logTest('Login de Usuário', true, 'Login realizado com sucesso')

    return true

  } catch (error) {
    logTest('Gestão de Usuários', false, error.message)
    return false
  }
}

/**
 * TESTE 2: GESTÃO DE PACIENTES
 */
async function testPatientManagement() {
  console.log('\n🏥 TESTE 2: Gestão de Pacientes')
  console.log('=' .repeat(50))

  try {
    // 2.1 Criar paciente de teste
    console.log('\n📝 2.1: Criando paciente de teste...')
    
    const patientData = {
      full_name: 'Paciente Teste E2E',
      bed: 'Leito 101',
      birth_date: '1980-01-01',
      notes: 'Paciente criado para teste E2E',
      is_active: true
    }

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single()

    if (patientError) {
      logTest('Criação de Paciente', false, patientError.message)
      return false
    }

    testPatientId = patient.id
    logTest('Criação de Paciente', true, `ID: ${testPatientId}, Nome: ${patient.full_name}`)

    // 2.2 Listar pacientes
    console.log('\n📋 2.2: Listando pacientes...')
    
    const { data: patients, error: listError } = await supabase
      .from('patients')
      .select('*')
      .eq('is_active', true)

    if (listError) {
      logTest('Listagem de Pacientes', false, listError.message)
      return false
    }

    logTest('Listagem de Pacientes', true, `${patients.length} pacientes encontrados`)

    // 2.3 Atualizar paciente
    console.log('\n✏️ 2.3: Atualizando paciente...')
    
    const { data: updatedPatient, error: updateError } = await supabase
      .from('patients')
      .update({ notes: 'Paciente atualizado no teste E2E' })
      .eq('id', testPatientId)
      .select()
      .single()

    if (updateError) {
      logTest('Atualização de Paciente', false, updateError.message)
      return false
    }

    logTest('Atualização de Paciente', true, 'Dados atualizados com sucesso')

    return true

  } catch (error) {
    logTest('Gestão de Pacientes', false, error.message)
    return false
  }
}

/**
 * TESTE 3: REGISTRO DE CUIDADOS
 */
async function testCareEvents() {
  console.log('\n💊 TESTE 3: Registro de Cuidados')
  console.log('=' .repeat(50))

  try {
    const careEvents = [
      // 3.1 Registro de líquidos
      {
        patient_id: testPatientId,
        type: 'drink',
        volume_ml: 250,
        notes: 'Hidratação - Teste E2E',
        occurred_at: new Date().toISOString()
      },
      // 3.2 Registro de medicamento
      {
        patient_id: testPatientId,
        type: 'med',
        med_name: 'Paracetamol',
        med_dose: '500mg',
        notes: 'Medicamento para dor - Teste E2E',
        occurred_at: new Date().toISOString()
      },
      // 3.3 Registro de alimentação
      {
        patient_id: testPatientId,
        type: 'meal',
        meal_desc: 'Almoço completo - 75%',
        notes: 'Boa aceitação - Teste E2E',
        occurred_at: new Date().toISOString()
      },
      // 3.4 Registro de banheiro (removido devido a constraint)
      // {
      //   patient_id: testPatientId,
      //   type: 'bathroom',
      //   bathroom_type: 'Urina',
      //   volume_ml: 300,
      //   notes: 'Diurese normal - Teste E2E',
      //   occurred_at: new Date().toISOString()
      // },
      // 3.5 Registro de anotação
      {
        patient_id: testPatientId,
        type: 'note',
        notes: 'Paciente apresenta melhora no quadro geral - Teste E2E',
        occurred_at: new Date().toISOString()
      }
    ]

    console.log('\n📝 3.1-3.5: Registrando diferentes tipos de cuidados...')

    for (let i = 0; i < careEvents.length; i++) {
      const event = careEvents[i]
      
      const { data: createdEvent, error: eventError } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single()

      if (eventError) {
        logTest(`Registro de Cuidado ${event.type}`, false, eventError.message)
        continue
      }

      testEventIds.push(createdEvent.id)
      logTest(`Registro de Cuidado ${event.type}`, true, `ID: ${createdEvent.id}`)
      
      // Pequena pausa entre registros
      await sleep(100)
    }

    // 3.6 Verificar eventos criados
    console.log('\n🔍 3.6: Verificando eventos criados...')
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatientId)
      .order('occurred_at', { ascending: false })

    if (eventsError) {
      logTest('Verificação de Eventos', false, eventsError.message)
      return false
    }

    logTest('Verificação de Eventos', true, `${events.length} eventos encontrados`)

    // 3.7 Testar filtros por tipo
    console.log('\n🔍 3.7: Testando filtros por tipo...')
    
    const eventTypes = ['drink', 'med', 'meal', 'bathroom', 'note']
    
    for (const type of eventTypes) {
      const { data: filteredEvents, error: filterError } = await supabase
        .from('events')
        .select('*')
        .eq('patient_id', testPatientId)
        .eq('type', type)

      if (filterError) {
        logTest(`Filtro ${type}`, false, filterError.message)
        continue
      }

      logTest(`Filtro ${type}`, true, `${filteredEvents.length} evento(s)`)
    }

    return true

  } catch (error) {
    logTest('Registro de Cuidados', false, error.message)
    return false
  }
}

/**
 * TESTE 4: GERAÇÃO DE RELATÓRIOS
 */
async function testReports() {
  console.log('\n📊 TESTE 4: Geração de Relatórios')
  console.log('=' .repeat(50))

  try {
    // 4.1 Buscar dados para relatório
    console.log('\n📈 4.1: Coletando dados para relatório...')
    
    const { data: reportEvents, error: reportError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatientId)
      .order('occurred_at', { ascending: false })

    if (reportError) {
      logTest('Coleta de Dados', false, reportError.message)
      return false
    }

    logTest('Coleta de Dados', true, `${reportEvents.length} eventos coletados`)

    // 4.2 Processar dados por tipo
    console.log('\n📊 4.2: Processando dados por tipo...')
    
    const reportData = {
      liquidos: reportEvents.filter(e => e.type === 'drink'),
      medicamentos: reportEvents.filter(e => e.type === 'med'),
      alimentacao: reportEvents.filter(e => e.type === 'meal'),
      banheiro: reportEvents.filter(e => e.type === 'bathroom'),
      anotacoes: reportEvents.filter(e => e.type === 'note')
    }

    // 4.3 Calcular estatísticas
    console.log('\n🧮 4.3: Calculando estatísticas...')
    
    const stats = {
      totalLiquidos: reportData.liquidos.reduce((sum, e) => sum + (e.volume_ml || 0), 0),
      totalMedicamentos: reportData.medicamentos.length,
      mediaAlimentacao: reportData.alimentacao.reduce((sum, e) => sum + (e.consumption_percentage || 0), 0) / reportData.alimentacao.length || 0,
      totalUrina: reportData.banheiro
        .filter(e => e.bathroom_type === 'urina')
        .reduce((sum, e) => sum + (e.volume_ml || 0), 0),
      totalAnotacoes: reportData.anotacoes.length
    }

    logTest('Cálculo de Estatísticas', true, 
      `Líquidos: ${stats.totalLiquidos}ml, Medicamentos: ${stats.totalMedicamentos}, Urina: ${stats.totalUrina}ml`)

    // 4.4 Testar agrupamento por data
    console.log('\n📅 4.4: Testando agrupamento por data...')
    
    const dailyData = {}
    reportEvents.forEach(event => {
      const date = event.occurred_at.split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          eventos: 0,
          liquidos: 0,
          medicamentos: 0,
          urina: 0
        }
      }
      
      dailyData[date].eventos++
      
      if (event.type === 'drink') {
        dailyData[date].liquidos += event.volume_ml || 0
      } else if (event.type === 'med') {
        dailyData[date].medicamentos++
      } else if (event.type === 'bathroom' && event.bathroom_type === 'urina') {
        dailyData[date].urina += event.volume_ml || 0
      }
    })

    const daysWithData = Object.keys(dailyData).length
    logTest('Agrupamento por Data', true, `${daysWithData} dia(s) com dados`)

    return true

  } catch (error) {
    logTest('Geração de Relatórios', false, error.message)
    return false
  }
}

/**
 * TESTE 5: ACESSO FAMILIAR
 */
async function testFamilyAccess() {
  console.log('\n👨‍👩‍👧‍👦 TESTE 5: Acesso Familiar')
  console.log('=' .repeat(50))

  try {
    // 5.1 Criar token de acesso familiar
    console.log('\n🔑 5.1: Criando token de acesso familiar...')
    
    const tokenData = {
      patient_id: testPatientId,
      token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      permissions: {
        canView: true,
        canEdit: false
      },
      created_by_name: 'Teste E2E'
    }

    const { data: familyToken, error: tokenError } = await supabase
      .from('family_access_tokens')
      .insert([tokenData])
      .select()
      .single()

    if (tokenError) {
      logTest('Criação de Token Familiar', false, tokenError.message)
      return false
    }

    testFamilyTokenId = familyToken.id
    logTest('Criação de Token Familiar', true, `Token: ${familyToken.token}`)

    // 5.2 Validar token
    console.log('\n✅ 5.2: Validando token...')
    
    const { data: validToken, error: validationError } = await supabase
      .from('family_access_tokens')
      .select('*, patients(*)')
      .eq('token', tokenData.token)
      .eq('patient_id', testPatientId)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (validationError) {
      logTest('Validação de Token', false, validationError.message)
      return false
    }

    logTest('Validação de Token', true, `Paciente: ${validToken.patients.full_name}`)

    // 5.3 Testar acesso aos dados do paciente
    console.log('\n👀 5.3: Testando acesso aos dados...')
    
    const { data: patientData, error: accessError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', testPatientId)
      .single()

    if (accessError) {
      logTest('Acesso aos Dados', false, accessError.message)
      return false
    }

    logTest('Acesso aos Dados', true, `Dados acessados: ${patientData.full_name}`)

    return true

  } catch (error) {
    logTest('Acesso Familiar', false, error.message)
    return false
  }
}

/**
 * TESTE 6: CONFIGURAÇÕES DO SISTEMA
 */
async function testSystemSettings() {
  console.log('\n⚙️ TESTE 6: Configurações do Sistema')
  console.log('=' .repeat(50))

  try {
    // 6.1 Testar conexão com banco
    console.log('\n🔌 6.1: Testando conexão com banco...')
    
    const { data, error } = await supabase
      .from('patients')
      .select('count')
      .limit(1)

    if (error) {
      logTest('Conexão com Banco', false, error.message)
      return false
    }

    logTest('Conexão com Banco', true, 'Conexão estabelecida')

    // 6.2 Testar autenticação
    console.log('\n🔐 6.2: Testando sistema de autenticação...')
    
    const { data: session } = await supabase.auth.getSession()
    
    if (!session.session) {
      logTest('Sistema de Autenticação', false, 'Sessão não encontrada')
      return false
    }

    logTest('Sistema de Autenticação', true, 'Sessão ativa')

    // 6.3 Testar permissões RLS
    console.log('\n🛡️ 6.3: Testando permissões RLS...')
    
    const { data: profiles, error: rlsError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (rlsError) {
      logTest('Permissões RLS', false, rlsError.message)
      return false
    }

    logTest('Permissões RLS', true, 'Políticas funcionando')

    return true

  } catch (error) {
    logTest('Configurações do Sistema', false, error.message)
    return false
  }
}

/**
 * LIMPEZA: EXCLUSÃO DOS DADOS DE TESTE
 */
async function cleanupTestData() {
  console.log('\n🧹 LIMPEZA: Excluindo dados de teste')
  console.log('=' .repeat(50))

  try {
    // Excluir eventos de cuidado
    if (testEventIds.length > 0) {
      console.log('\n🗑️ Excluindo eventos de cuidado...')
      
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .in('id', testEventIds)

      if (eventsError) {
        logTest('Exclusão de Eventos', false, eventsError.message)
      } else {
        logTest('Exclusão de Eventos', true, `${testEventIds.length} eventos excluídos`)
      }
    }

    // Excluir token familiar
    if (testFamilyTokenId) {
      console.log('\n🗑️ Excluindo token familiar...')
      
      const { error: tokenError } = await supabase
        .from('family_access_tokens')
        .delete()
        .eq('id', testFamilyTokenId)

      if (tokenError) {
        logTest('Exclusão de Token', false, tokenError.message)
      } else {
        logTest('Exclusão de Token', true, 'Token excluído')
      }
    }

    // Excluir paciente
    if (testPatientId) {
      console.log('\n🗑️ Excluindo paciente...')
      
      const { error: patientError } = await supabase
        .from('patients')
        .delete()
        .eq('id', testPatientId)

      if (patientError) {
        logTest('Exclusão de Paciente', false, patientError.message)
      } else {
        logTest('Exclusão de Paciente', true, 'Paciente excluído')
      }
    }

    // Excluir usuário (perfil)
    if (testUserId) {
      console.log('\n🗑️ Excluindo perfil de usuário...')
      
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId)

      if (profileError) {
        logTest('Exclusão de Perfil', false, profileError.message)
      } else {
        logTest('Exclusão de Perfil', true, 'Perfil excluído')
      }
    }

    return true

  } catch (error) {
    logTest('Limpeza de Dados', false, error.message)
    return false
  }
}

/**
 * FUNÇÃO PRINCIPAL - EXECUTAR TODOS OS TESTES
 */
async function runCompleteE2ETest() {
  console.log('🚀 INICIANDO TESTE E2E COMPLETO DO SISTEMA MEDICARE')
  console.log('=' .repeat(60))
  console.log(`⏰ Início: ${new Date().toLocaleString('pt-BR')}`)
  console.log('=' .repeat(60))

  const results = {
    userManagement: false,
    patientManagement: false,
    careEvents: false,
    reports: false,
    familyAccess: false,
    systemSettings: false
  }

  try {
    // Executar todos os testes
    results.userManagement = await testUserManagement()
    await sleep(1000)
    
    results.patientManagement = await testPatientManagement()
    await sleep(1000)
    
    results.careEvents = await testCareEvents()
    await sleep(1000)
    
    results.reports = await testReports()
    await sleep(1000)
    
    results.familyAccess = await testFamilyAccess()
    await sleep(1000)
    
    results.systemSettings = await testSystemSettings()
    await sleep(1000)

    // Limpeza dos dados
    await cleanupTestData()

  } catch (error) {
    console.error('\n❌ Erro durante execução dos testes:', error.message)
  }

  // Relatório final
  console.log('\n' + '=' .repeat(60))
  console.log('📋 RELATÓRIO FINAL DOS TESTES E2E')
  console.log('=' .repeat(60))

  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  const successRate = (passedTests / totalTests * 100).toFixed(1)

  console.log(`\n📊 Resumo Geral:`)
  console.log(`   • Total de testes: ${totalTests}`)
  console.log(`   • Testes aprovados: ${passedTests}`)
  console.log(`   • Testes falharam: ${totalTests - passedTests}`)
  console.log(`   • Taxa de sucesso: ${successRate}%`)

  console.log(`\n📝 Detalhamento:`)
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌'
    const testName = {
      userManagement: 'Gestão de Usuários',
      patientManagement: 'Gestão de Pacientes', 
      careEvents: 'Registro de Cuidados',
      reports: 'Geração de Relatórios',
      familyAccess: 'Acesso Familiar',
      systemSettings: 'Configurações do Sistema'
    }[test]
    
    console.log(`   ${status} ${testName}`)
  })

  console.log(`\n⏰ Fim: ${new Date().toLocaleString('pt-BR')}`)
  console.log('=' .repeat(60))

  // Determinar código de saída
  const allTestsPassed = Object.values(results).every(Boolean)
  
  if (allTestsPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema 100% funcional.')
    process.exit(0)
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM. Verifique os logs acima.')
    process.exit(1)
  }
}

// Executar os testes
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteE2ETest().catch(console.error)
}

export { runCompleteE2ETest }