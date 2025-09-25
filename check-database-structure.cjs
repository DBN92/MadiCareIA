const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estrutura da base de dados...\n');
  
  try {
    // Verificar tabela patients
    console.log('📋 TABELA PATIENTS:');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(3);
      
    if (patientsError) {
      console.error('❌ Erro ao buscar patients:', patientsError.message);
    } else {
      console.log(`  - Total de registros: ${patients?.length || 0}`);
      if (patients && patients.length > 0) {
        console.log('  - Campos disponíveis:', Object.keys(patients[0]));
        patients.forEach((p, i) => {
          console.log(`  - Registro ${i + 1}:`);
          console.log(`    Nome: ${p.full_name}`);
          console.log(`    Leito: ${p.bed || 'N/A'}`);
          console.log(`    Notas: ${p.notes || 'N/A'}`);
          console.log(`    Ativo: ${p.is_active}`);
        });
      }
    }
    
    console.log('\n📅 TABELA EVENTS:');
    // Verificar tabela events com campos básicos
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(3);
      
    if (eventsError) {
      console.error('❌ Erro ao buscar events:', eventsError.message);
    } else {
      console.log(`  - Total de registros: ${events?.length || 0}`);
      if (events && events.length > 0) {
        console.log('  - Campos disponíveis:', Object.keys(events[0]));
        events.forEach((e, i) => {
          console.log(`  - Registro ${i + 1}:`);
          console.log(`    Tipo: ${e.type}`);
          console.log(`    Notas: ${e.notes || 'N/A'}`);
          console.log(`    Medicamento: ${e.medication_name || e.med_name || 'N/A'}`);
        });
      }
    }
    
    // Verificar tipos de eventos únicos
    const { data: eventTypes, error: typesError } = await supabase
      .from('events')
      .select('type');
      
    if (!typesError && eventTypes) {
      const uniqueTypes = [...new Set(eventTypes.map(e => e.type))];
      console.log('  - Tipos de eventos únicos:', uniqueTypes);
    }
    
    console.log('\n👥 TABELA PROFILES:');
    // Verificar tabela profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
      
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError.message);
    } else {
      console.log(`  - Total de registros: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('  - Campos disponíveis:', Object.keys(profiles[0]));
        profiles.forEach((p, i) => {
          console.log(`  - Registro ${i + 1}:`);
          console.log(`    Nome: ${p.full_name || 'N/A'}`);
          console.log(`    Função: ${p.role || 'N/A'}`);
        });
      }
    }
    
    // Verificar funções únicas
    const { data: roles, error: rolesError } = await supabase
      .from('profiles')
      .select('role');
      
    if (!rolesError && roles) {
      const uniqueRoles = [...new Set(roles.map(r => r.role).filter(Boolean))];
      console.log('  - Funções únicas:', uniqueRoles);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkDatabaseStructure().catch(console.error);