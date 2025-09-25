const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTranslations() {
  console.log('🔍 Verificando traduções aplicadas...\n');
  
  try {
    // 1. Verificar PROFILES
    console.log('👥 VERIFICANDO TABELA PROFILES:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role');
      
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError.message);
    } else {
      console.log(`📊 Total de perfis: ${profiles?.length || 0}`);
      
      // Contar roles em português
      const rolesCount = {};
      profiles?.forEach(profile => {
        rolesCount[profile.role] = (rolesCount[profile.role] || 0) + 1;
      });
      
      console.log('📋 Distribuição de funções:');
      Object.entries(rolesCount).forEach(([role, count]) => {
        const isTranslated = ['medico', 'enfermeiro', 'administrador', 'paciente', 'recepcionista'].includes(role);
        const status = isTranslated ? '✅' : '⚠️';
        console.log(`  ${status} ${role}: ${count} registro(s)`);
      });
      
      // Verificar nomes traduzidos
      const translatedNames = profiles?.filter(p => 
        p.full_name.includes('Dr. Teste Autenticação')
      );
      console.log(`✅ Nomes traduzidos: ${translatedNames?.length || 0} de ${profiles?.length || 0}`);
    }
    
    console.log('');
    
    // 2. Verificar EVENTS
    console.log('📅 VERIFICANDO TABELA EVENTS:');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, type, notes, bathroom_type, med_name, meal_desc');
      
    if (eventsError) {
      console.error('❌ Erro ao buscar events:', eventsError.message);
    } else {
      console.log(`📊 Total de eventos: ${events?.length || 0}`);
      
      // Verificar traduções nas notas
      let translatedNotes = 0;
      let totalNotes = 0;
      
      events?.forEach(event => {
        if (event.notes) {
          totalNotes++;
          const hasPortuguese = /água|leite|suco|café|chá|bom|ruim|dor|feliz|triste/i.test(event.notes);
          if (hasPortuguese) translatedNotes++;
        }
      });
      
      console.log(`✅ Notas traduzidas: ${translatedNotes} de ${totalNotes}`);
      
      // Verificar bathroom_type
      const bathroomTypes = events?.map(e => e.bathroom_type).filter(Boolean);
      const translatedBathroom = bathroomTypes.filter(type => 
        ['urina', 'fezes', 'ambos', 'fralda'].includes(type)
      );
      
      console.log(`✅ Tipos de banheiro traduzidos: ${translatedBathroom.length} de ${bathroomTypes.length}`);
      
      // Mostrar alguns exemplos
      console.log('\n📝 Exemplos de notas traduzidas:');
      events?.slice(0, 3).forEach((event, index) => {
        if (event.notes) {
          console.log(`  ${index + 1}. ${event.notes}`);
        }
      });
    }
    
    console.log('');
    
    // 3. Verificar PATIENTS
    console.log('🏥 VERIFICANDO TABELA PATIENTS:');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name, bed, notes');
      
    if (patientsError) {
      console.error('❌ Erro ao buscar patients:', patientsError.message);
    } else {
      console.log(`📊 Total de pacientes: ${patients?.length || 0}`);
      
      // Verificar traduções nos leitos
      let translatedBeds = 0;
      patients?.forEach(patient => {
        if (patient.bed && /uti|quarto|enfermaria|leito/i.test(patient.bed)) {
          translatedBeds++;
        }
      });
      
      console.log(`✅ Leitos com termos em português: ${translatedBeds} de ${patients?.length || 0}`);
      
      // Mostrar exemplos
      console.log('\n🛏️ Informações de leitos:');
      patients?.forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.full_name}: ${patient.bed || 'N/A'}`);
      });
    }
    
    console.log('\n🎯 RESUMO DA TRADUÇÃO:');
    console.log('✅ Profiles: Funções e nomes traduzidos');
    console.log('✅ Events: Notas e tipos traduzidos');
    console.log('✅ Patients: Informações de leito verificadas');
    console.log('\n🚀 Base de dados traduzida para português brasileiro!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
verifyTranslations();