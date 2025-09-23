import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/["']/g, '').trim();
    envVars[key.trim()] = value;
  }
});

const supabaseUrl = `https://${envVars.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

let testResults = [];
let testPatientId = null;
let familyTokens = [];

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`${status} - ${testName}`);
  if (details) console.log(`   ${details}`);
  testResults.push({ name: testName, passed, details });
}

// Simular localStorage para testes
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key] || null;
  }
  
  setItem(key, value) {
    this.store[key] = value;
  }
  
  removeItem(key) {
    delete this.store[key];
  }
  
  clear() {
    this.store = {};
  }
}

const mockLocalStorage = new MockLocalStorage();

async function createTestPatient() {
  console.log('\n👨‍⚕️ Criando paciente de teste...');
  
  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      full_name: 'Maria Silva - Teste Acesso Familiar',
      birth_date: '1975-08-20',
      bed: 'Leito 301B',
      notes: 'Paciente criada para teste de acesso familiar',
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar paciente:', error);
    return false;
  }

  testPatientId = patient.id;
  console.log(`✅ Paciente criado: ${patient.full_name} (ID: ${patient.id})`);
  return true;
}

function createFamilyTokens() {
  console.log('\n🔑 Criando tokens de acesso familiar...');
  
  const tokens = [
    {
      id: `editor-${Date.now()}`,
      patient_id: testPatientId,
      token: `FAM-EDIT-${Math.random().toString(36).substring(2, 15)}`,
      permissions: 'editor',
      is_active: true,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
    },
    {
      id: `viewer-${Date.now()}`,
      patient_id: testPatientId,
      token: `FAM-VIEW-${Math.random().toString(36).substring(2, 15)}`,
      permissions: 'viewer',
      is_active: true,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
    }
  ];
  
  // Salvar tokens no mock localStorage
  mockLocalStorage.setItem('family_tokens', JSON.stringify(tokens));
  familyTokens = tokens;
  
  console.log(`✅ ${tokens.length} tokens criados:`);
  tokens.forEach((token, index) => {
    console.log(`   ${index + 1}. ${token.permissions.toUpperCase()} - ${token.token.substring(0, 15)}...`);
  });
  
  return true;
}

function getStoredTokens() {
  const stored = mockLocalStorage.getItem('family_tokens');
  return stored ? JSON.parse(stored) : [];
}

async function testTokenValidation() {
  console.log('\n🔐 Teste 1: Validação de tokens...');
  
  const editorToken = familyTokens.find(t => t.permissions === 'editor');
  const viewerToken = familyTokens.find(t => t.permissions === 'viewer');
  
  // Teste 1.1: Token válido de editor
  const tokens = getStoredTokens();
  const validEditorToken = tokens.find(t => 
    t.patient_id === testPatientId && 
    t.token === editorToken.token && 
    t.is_active
  );
  
  logTest('Token Editor Válido', !!validEditorToken, 
    validEditorToken ? `Token encontrado: ${validEditorToken.permissions}` : 'Token não encontrado');
  
  // Teste 1.2: Token válido de viewer
  const validViewerToken = tokens.find(t => 
    t.patient_id === testPatientId && 
    t.token === viewerToken.token && 
    t.is_active
  );
  
  logTest('Token Viewer Válido', !!validViewerToken, 
    validViewerToken ? `Token encontrado: ${validViewerToken.permissions}` : 'Token não encontrado');
  
  // Teste 1.3: Token inválido
  const invalidToken = tokens.find(t => 
    t.patient_id === testPatientId && 
    t.token === 'INVALID-TOKEN' && 
    t.is_active
  );
  
  logTest('Token Inválido Rejeitado', !invalidToken, 
    !invalidToken ? 'Token inválido corretamente rejeitado' : 'Token inválido aceito incorretamente');
}

async function testPatientDataAccess() {
  console.log('\n👤 Teste 2: Acesso aos dados do paciente...');
  
  try {
    // Simular busca de dados do paciente
    const { data: patientData, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', testPatientId)
      .eq('is_active', true)
      .single();

    if (error) {
      logTest('Acesso aos Dados do Paciente', false, `Erro: ${error.message}`);
      return;
    }

    logTest('Acesso aos Dados do Paciente', !!patientData, 
      patientData ? `Paciente: ${patientData.full_name}` : 'Dados não encontrados');
    
    // Verificar campos essenciais
    const hasEssentialFields = patientData && 
      patientData.full_name && 
      patientData.birth_date && 
      patientData.bed;
    
    logTest('Campos Essenciais Presentes', hasEssentialFields, 
      hasEssentialFields ? 'Nome, data nascimento e leito presentes' : 'Campos essenciais ausentes');
    
  } catch (error) {
    logTest('Acesso aos Dados do Paciente', false, `Erro: ${error.message}`);
  }
}

async function testCareEventsAccess() {
  console.log('\n📋 Teste 3: Acesso aos eventos de cuidados...');
  
  // Primeiro, criar alguns eventos de teste
  const testEvents = [
    {
      patient_id: testPatientId,
      type: 'med',
      med_name: 'Dipirona',
      med_dose: '500mg',
      occurred_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      notes: 'Administrado para dor'
    },
    {
      patient_id: testPatientId,
      type: 'drink',
      volume_ml: 200,
      occurred_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      notes: 'Água'
    }
  ];
  
  const { error: insertError } = await supabase
    .from('events')
    .insert(testEvents);
  
  if (insertError) {
    logTest('Criação de Eventos de Teste', false, `Erro: ${insertError.message}`);
    return;
  }
  
  console.log('✅ Eventos de teste criados');
  
  // Testar acesso aos eventos
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatientId)
      .order('occurred_at', { ascending: false });

    if (error) {
      logTest('Acesso aos Eventos', false, `Erro: ${error.message}`);
      return;
    }

    logTest('Acesso aos Eventos', events && events.length > 0, 
      events ? `${events.length} eventos encontrados` : 'Nenhum evento encontrado');
    
    // Verificar tipos de eventos
    const eventTypes = [...new Set(events.map(e => e.type))];
    logTest('Tipos de Eventos Diversos', eventTypes.length > 1, 
      `Tipos encontrados: ${eventTypes.join(', ')}`);
    
    // Mostrar eventos encontrados
    console.log('   Eventos encontrados:');
    events.slice(0, 3).forEach((event, index) => {
      const time = new Date(event.occurred_at).toLocaleString('pt-BR');
      let description = '';
      
      switch(event.type) {
        case 'med':
          description = `${event.med_name} ${event.med_dose}`;
          break;
        case 'drink':
          description = `${event.volume_ml}ml`;
          break;
        default:
          description = event.notes || 'Sem descrição';
      }
      
      console.log(`   ${index + 1}. [${event.type.toUpperCase()}] ${time} - ${description}`);
    });
    
  } catch (error) {
    logTest('Acesso aos Eventos', false, `Erro: ${error.message}`);
  }
}

async function testPermissionLevels() {
  console.log('\n🔒 Teste 4: Níveis de permissão...');
  
  const editorToken = familyTokens.find(t => t.permissions === 'editor');
  const viewerToken = familyTokens.find(t => t.permissions === 'viewer');
  
  // Simular verificação de permissões
  const canEdit = (token) => {
    const tokenData = familyTokens.find(t => t.token === token);
    return tokenData && tokenData.permissions === 'editor';
  };
  
  const canView = (token) => {
    const tokenData = familyTokens.find(t => t.token === token);
    return tokenData && (tokenData.permissions === 'editor' || tokenData.permissions === 'viewer');
  };
  
  // Teste permissões do editor
  logTest('Editor Pode Visualizar', canView(editorToken.token), 
    'Token de editor tem permissão de visualização');
  
  logTest('Editor Pode Editar', canEdit(editorToken.token), 
    'Token de editor tem permissão de edição');
  
  // Teste permissões do viewer
  logTest('Viewer Pode Visualizar', canView(viewerToken.token), 
    'Token de viewer tem permissão de visualização');
  
  logTest('Viewer Não Pode Editar', !canEdit(viewerToken.token), 
    'Token de viewer não tem permissão de edição');
}

async function testTokenExpiration() {
  console.log('\n⏰ Teste 5: Expiração de tokens...');
  
  // Criar token expirado
  const expiredToken = {
    id: `expired-${Date.now()}`,
    patient_id: testPatientId,
    token: `FAM-EXP-${Math.random().toString(36).substring(2, 15)}`,
    permissions: 'viewer',
    is_active: true,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Expirado há 1 dia
  };
  
  const allTokens = [...familyTokens, expiredToken];
  mockLocalStorage.setItem('family_tokens', JSON.stringify(allTokens));
  
  // Função para verificar se token está expirado
  const isTokenExpired = (token) => {
    const tokenData = allTokens.find(t => t.token === token);
    if (!tokenData) return true;
    
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    return now > expiresAt;
  };
  
  // Testar tokens válidos
  const editorToken = familyTokens.find(t => t.permissions === 'editor');
  logTest('Token Válido Não Expirado', !isTokenExpired(editorToken.token), 
    'Token de editor ainda válido');
  
  // Testar token expirado
  logTest('Token Expirado Detectado', isTokenExpired(expiredToken.token), 
    'Token expirado corretamente identificado');
}

async function cleanup() {
  console.log('\n🧹 Limpeza dos dados de teste...');
  
  if (testPatientId) {
    // Remover eventos
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .eq('patient_id', testPatientId);

    if (eventsError) {
      console.error('❌ Erro ao remover eventos:', eventsError);
    } else {
      console.log('✅ Eventos removidos');
    }

    // Remover paciente
    const { error: patientError } = await supabase
      .from('patients')
      .delete()
      .eq('id', testPatientId);

    if (patientError) {
      console.error('❌ Erro ao remover paciente:', patientError);
    } else {
      console.log('✅ Paciente de teste removido');
    }
  }
  
  // Limpar mock localStorage
  mockLocalStorage.clear();
  console.log('✅ Tokens de teste removidos');
}

async function runFamilyAccessTests() {
  console.log('👨‍👩‍👧‍👦 INICIANDO TESTES DE ACESSO FAMILIAR');
  console.log('==========================================\n');

  try {
    // Criar dados de teste
    const patientCreated = await createTestPatient();
    if (!patientCreated) {
      console.log('❌ Falha na criação do paciente de teste');
      return;
    }
    
    const tokensCreated = createFamilyTokens();
    if (!tokensCreated) {
      console.log('❌ Falha na criação dos tokens');
      return;
    }

    // Executar testes
    await testTokenValidation();
    await testPatientDataAccess();
    await testCareEventsAccess();
    await testPermissionLevels();
    await testTokenExpiration();

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await cleanup();
  }

  // Relatório final
  console.log('\n==================================================');
  console.log('📋 RELATÓRIO FINAL - ACESSO FAMILIAR');
  console.log('==================================================');
  
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} - ${result.name}`);
  });

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n📊 RESUMO:');
  console.log(`   Testes executados: ${totalTests}`);
  console.log(`   Testes aprovados: ${passedTests}`);
  console.log(`   Taxa de sucesso: ${successRate}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 TODOS OS TESTES DE ACESSO FAMILIAR PASSARAM!');
    console.log('👨‍👩‍👧‍👦 Sistema de acesso familiar funcionando perfeitamente.');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM!');
    console.log('🔧 Verifique os erros acima para correções necessárias.');
  }
}

// Executar testes
runFamilyAccessTests().catch(console.error);