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

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`${status} - ${testName}`);
  if (details) console.log(`   ${details}`);
  testResults.push({ name: testName, passed, details });
}

async function createTestData() {
  console.log('\n📊 Criando dados de teste para relatórios...');
  
  // Criar paciente de teste
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .insert({
      full_name: 'João Santos - Teste Relatórios',
      birth_date: '1950-05-15',
      bed: 'Leito 205A',
      notes: 'Paciente criado para teste de relatórios',
      is_active: true
    })
    .select()
    .single();

  if (patientError) {
    console.error('❌ Erro ao criar paciente:', patientError);
    return false;
  }

  testPatientId = patient.id;
  console.log(`✅ Paciente criado: ${patient.full_name} (ID: ${patient.id})`);

  // Criar eventos de diferentes tipos e horários
  const now = new Date();
  const events = [
    {
      patient_id: patient.id,
      type: 'med',
      med_name: 'Paracetamol',
      med_dose: '750mg',
      occurred_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
      notes: 'Administrado para dor de cabeça'
    },
    {
      patient_id: patient.id,
      type: 'drink',
      volume_ml: 250,
      occurred_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1h atrás
      notes: 'Água'
    },
    {
      patient_id: patient.id,
      type: 'meal',
      meal_desc: 'Jantar - sopa de legumes',
      occurred_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3h atrás
      notes: 'Aceitou bem a refeição'
    },
    {
      patient_id: patient.id,
      type: 'note',
      notes: 'Paciente relatou melhora na dor - Observação médica',
      occurred_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString() // 30min atrás
    },
    {
      patient_id: patient.id,
      type: 'med',
      med_name: 'Omeprazol',
      med_dose: '20mg',
      occurred_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 24h atrás
      notes: 'Protetor gástrico'
    }
  ];

  const { error: eventsError } = await supabase
    .from('events')
    .insert(events);

  if (eventsError) {
    console.error('❌ Erro ao criar eventos:', eventsError);
    return false;
  }

  console.log(`✅ ${events.length} eventos criados para teste`);
  return true;
}

async function testReportGeneration() {
  console.log('\n📋 Teste 1: Relatório geral do paciente...');
  
  const { data: allEvents, error } = await supabase
    .from('events')
    .select('*')
    .eq('patient_id', testPatientId)
    .order('occurred_at', { ascending: false });

  if (error) {
    logTest('Relatório Geral', false, `Erro: ${error.message}`);
    return;
  }

  logTest('Relatório Geral', allEvents.length > 0, `${allEvents.length} eventos encontrados`);
  
  // Mostrar resumo dos eventos
  console.log('   Eventos encontrados:');
  allEvents.forEach((event, index) => {
    const time = new Date(event.occurred_at).toLocaleString('pt-BR');
    let description = '';
    
    switch(event.type) {
      case 'med':
        description = `${event.med_name} ${event.med_dose}`;
        break;
      case 'drink':
        description = `${event.volume_ml}ml de líquido`;
        break;
      case 'meal':
        description = event.meal_desc;
        break;
      case 'note':
        description = event.notes ? event.notes.substring(0, 50) + '...' : 'Anotação';
        break;
    }
    
    console.log(`   ${index + 1}. [${event.type.toUpperCase()}] ${time} - ${description}`);
  });
}

async function testReportsByType() {
  console.log('\n💊 Teste 2: Relatório por tipo (medicamentos)...');
  
  const { data: medEvents, error } = await supabase
    .from('events')
    .select('*')
    .eq('patient_id', testPatientId)
    .eq('type', 'med')
    .order('occurred_at', { ascending: false });

  if (error) {
    logTest('Relatório por Tipo', false, `Erro: ${error.message}`);
    return;
  }

  logTest('Relatório por Tipo', medEvents.length > 0, `${medEvents.length} medicamentos encontrados`);
  
  medEvents.forEach((event, index) => {
    const time = new Date(event.occurred_at).toLocaleString('pt-BR');
    console.log(`   ${index + 1}. ${time} - ${event.med_name} ${event.med_dose}`);
  });
}

async function testReportsByPeriod() {
  console.log('\n📅 Teste 3: Relatório por período (últimas 2 horas)...');
  
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  
  const { data: recentEvents, error } = await supabase
    .from('events')
    .select('*')
    .eq('patient_id', testPatientId)
    .gte('occurred_at', twoHoursAgo)
    .order('occurred_at', { ascending: false });

  if (error) {
    logTest('Relatório por Período', false, `Erro: ${error.message}`);
    return;
  }

  logTest('Relatório por Período', recentEvents.length > 0, `${recentEvents.length} eventos nas últimas 2h`);
  
  recentEvents.forEach((event, index) => {
    const time = new Date(event.occurred_at).toLocaleString('pt-BR');
    let description = '';
    
    switch(event.type) {
      case 'med':
        description = `${event.med_name} ${event.med_dose}`;
        break;
      case 'drink':
        description = `${event.volume_ml}ml`;
        break;
      case 'note':
        description = event.notes ? event.notes.substring(0, 30) + '...' : 'Anotação';
        break;
    }
    
    console.log(`   ${index + 1}. [${event.type.toUpperCase()}] ${time} - ${description}`);
  });
}

async function testReportSummary() {
  console.log('\n📊 Teste 4: Resumo estatístico...');
  
  const { data: events, error } = await supabase
    .from('events')
    .select('type')
    .eq('patient_id', testPatientId);

  if (error) {
    logTest('Resumo Estatístico', false, `Erro: ${error.message}`);
    return;
  }

  // Contar eventos por tipo
  const summary = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  logTest('Resumo Estatístico', Object.keys(summary).length > 0, 'Estatísticas geradas');
  
  console.log('   Resumo por tipo:');
  Object.entries(summary).forEach(([type, count]) => {
    const typeNames = {
      med: 'Medicamentos',
      drink: 'Líquidos',
      meal: 'Refeições',
      note: 'Anotações'
    };
    console.log(`   - ${typeNames[type] || type}: ${count}`);
  });
}

async function testReportExport() {
  console.log('\n📄 Teste 5: Simulação de exportação de relatório...');
  
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      patients!inner(full_name, bed)
    `)
    .eq('patient_id', testPatientId)
    .order('occurred_at', { ascending: false });

  if (error) {
    logTest('Exportação de Relatório', false, `Erro: ${error.message}`);
    return;
  }

  // Simular geração de relatório em formato texto
  const reportContent = generateTextReport(events);
  
  logTest('Exportação de Relatório', reportContent.length > 0, `Relatório gerado (${reportContent.length} caracteres)`);
  
  console.log('   Preview do relatório:');
  console.log('   ' + reportContent.substring(0, 200) + '...');
}

function generateTextReport(events) {
  if (!events || events.length === 0) return '';
  
  const patient = events[0].patients;
  let report = `RELATÓRIO DE CUIDADOS\n`;
  report += `===================\n\n`;
  report += `Paciente: ${patient.full_name}\n`;
  report += `Leito: ${patient.bed}\n`;
  report += `Data do relatório: ${new Date().toLocaleString('pt-BR')}\n\n`;
  
  report += `EVENTOS REGISTRADOS:\n`;
  report += `-------------------\n`;
  
  events.forEach((event, index) => {
    const time = new Date(event.occurred_at).toLocaleString('pt-BR');
    report += `${index + 1}. ${time} - ${event.type.toUpperCase()}\n`;
    
    switch(event.type) {
      case 'med':
        report += `   Medicamento: ${event.med_name} ${event.med_dose}\n`;
        break;
      case 'drink':
        report += `   Volume: ${event.volume_ml}ml\n`;
        break;
      case 'meal':
        report += `   Refeição: ${event.meal_desc}\n`;
        break;
      case 'note':
        report += `   Anotação: ${event.notes}\n`;
        break;
    }
    
    if (event.notes) {
      report += `   Observações: ${event.notes}\n`;
    }
    report += `\n`;
  });
  
  return report;
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
}

async function runReportsTests() {
  console.log('🏥 INICIANDO TESTES DE RELATÓRIOS');
  console.log('==================================\n');

  try {
    // Criar dados de teste
    const dataCreated = await createTestData();
    if (!dataCreated) {
      console.log('❌ Falha na criação de dados de teste');
      return;
    }

    // Executar testes
    await testReportGeneration();
    await testReportsByType();
    await testReportsByPeriod();
    await testReportSummary();
    await testReportExport();

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await cleanup();
  }

  // Relatório final
  console.log('\n==================================================');
  console.log('📋 RELATÓRIO FINAL - GERAÇÃO DE RELATÓRIOS');
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
    console.log('\n🎉 TODOS OS TESTES DE RELATÓRIOS PASSARAM!');
    console.log('📊 Sistema de relatórios funcionando perfeitamente.');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM!');
    console.log('🔧 Verifique os erros acima para correções necessárias.');
  }
}

// Executar testes
runReportsTests().catch(console.error);