const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeTranslations() {
  console.log('🌍 Iniciando tradução da base de dados para português brasileiro...\n');
  
  try {
    // 1. Traduzir tabela PROFILES
    console.log('👥 Traduzindo tabela PROFILES...');
    
    // Traduzir roles
    const { data: profilesRoles, error: rolesError } = await supabase
      .from('profiles')
      .update({ 
        role: 'medico'
      })
      .eq('role', 'doctor')
      .select();
      
    if (rolesError) {
      console.error('❌ Erro ao traduzir roles:', rolesError.message);
    } else {
      console.log(`✅ Traduzidos ${profilesRoles?.length || 0} registros de 'doctor' para 'medico'`);
    }
    
    // Traduzir nurse para enfermeiro
    const { data: nursesRoles, error: nursesError } = await supabase
      .from('profiles')
      .update({ 
        role: 'enfermeiro'
      })
      .eq('role', 'nurse')
      .select();
      
    if (nursesError) {
      console.error('❌ Erro ao traduzir nurses:', nursesError.message);
    } else {
      console.log(`✅ Traduzidos ${nursesRoles?.length || 0} registros de 'nurse' para 'enfermeiro'`);
    }
    
    // Traduzir admin para administrador
    const { data: adminRoles, error: adminError } = await supabase
      .from('profiles')
      .update({ 
        role: 'administrador'
      })
      .eq('role', 'admin')
      .select();
      
    if (adminError) {
      console.error('❌ Erro ao traduzir admin:', adminError.message);
    } else {
      console.log(`✅ Traduzidos ${adminRoles?.length || 0} registros de 'admin' para 'administrador'`);
    }
    
    // Traduzir nomes de teste
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .like('full_name', '%Dr. Teste Auth%');
      
    if (!profilesError && profiles) {
      for (const profile of profiles) {
        const newName = profile.full_name.replace('Dr. Teste Auth', 'Dr. Teste Autenticação');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: newName })
          .eq('id', profile.id);
          
        if (updateError) {
          console.error(`❌ Erro ao traduzir nome ${profile.full_name}:`, updateError.message);
        } else {
          console.log(`✅ Nome traduzido: ${profile.full_name} → ${newName}`);
        }
      }
    }
    
    console.log('');
    
    // 2. Traduzir tabela EVENTS
    console.log('📅 Traduzindo tabela EVENTS...');
    
    // Buscar todos os eventos com notas
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, notes, med_name, meal_desc, mood_notes, bathroom_type')
      .not('notes', 'is', null);
      
    if (eventsError) {
      console.error('❌ Erro ao buscar events:', eventsError.message);
    } else {
      console.log(`📋 Encontrados ${events?.length || 0} eventos para traduzir`);
      
      for (const event of events || []) {
        let updates = {};
        let hasUpdates = false;
        
        // Traduzir notas
        if (event.notes) {
          let translatedNotes = event.notes
            .replace(/Water/gi, 'Água')
            .replace(/Milk/gi, 'Leite')
            .replace(/Juice/gi, 'Suco')
            .replace(/Coffee/gi, 'Café')
            .replace(/Tea/gi, 'Chá')
            .replace(/Good/gi, 'Bom')
            .replace(/Bad/gi, 'Ruim')
            .replace(/Normal/gi, 'Normal')
            .replace(/Pain/gi, 'Dor')
            .replace(/Happy/gi, 'Feliz')
            .replace(/Sad/gi, 'Triste');
            
          if (translatedNotes !== event.notes) {
            updates.notes = translatedNotes;
            hasUpdates = true;
          }
        }
        
        // Traduzir bathroom_type
        if (event.bathroom_type) {
          let translatedBathroom = event.bathroom_type;
          switch (event.bathroom_type) {
            case 'urine':
              translatedBathroom = 'urina';
              break;
            case 'feces':
              translatedBathroom = 'fezes';
              break;
            case 'both':
              translatedBathroom = 'ambos';
              break;
            case 'diaper':
              translatedBathroom = 'fralda';
              break;
          }
          
          if (translatedBathroom !== event.bathroom_type) {
            updates.bathroom_type = translatedBathroom;
            hasUpdates = true;
          }
        }
        
        // Aplicar atualizações se houver
        if (hasUpdates) {
          const { error: updateError } = await supabase
            .from('events')
            .update(updates)
            .eq('id', event.id);
            
          if (updateError) {
            console.error(`❌ Erro ao atualizar evento ${event.id}:`, updateError.message);
          } else {
            console.log(`✅ Evento ${event.id} traduzido`);
          }
        }
      }
    }
    
    console.log('');
    
    // 3. Traduzir tabela PATIENTS
    console.log('🏥 Traduzindo tabela PATIENTS...');
    
    // Buscar pacientes com informações para traduzir
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, notes, bed');
      
    if (patientsError) {
      console.error('❌ Erro ao buscar patients:', patientsError.message);
    } else {
      console.log(`👤 Encontrados ${patients?.length || 0} pacientes para verificar`);
      
      for (const patient of patients || []) {
        let updates = {};
        let hasUpdates = false;
        
        // Traduzir notas
        if (patient.notes) {
          let translatedNotes = patient.notes
            .replace(/Admitted/gi, 'Internado')
            .replace(/Discharged/gi, 'Alta médica')
            .replace(/Surgery/gi, 'Cirurgia')
            .replace(/Treatment/gi, 'Tratamento')
            .replace(/Recovery/gi, 'Recuperação')
            .replace(/Stable/gi, 'Estável')
            .replace(/Critical/gi, 'Crítico')
            .replace(/Improving/gi, 'Melhorando');
            
          if (translatedNotes !== patient.notes) {
            updates.notes = translatedNotes;
            hasUpdates = true;
          }
        }
        
        // Traduzir informações de leito
        if (patient.bed) {
          let translatedBed = patient.bed
            .replace(/ICU/gi, 'UTI')
            .replace(/Room/gi, 'Quarto')
            .replace(/Ward/gi, 'Enfermaria')
            .replace(/Bed/gi, 'Leito');
            
          if (translatedBed !== patient.bed) {
            updates.bed = translatedBed;
            hasUpdates = true;
          }
        }
        
        // Aplicar atualizações se houver
        if (hasUpdates) {
          const { error: updateError } = await supabase
            .from('patients')
            .update(updates)
            .eq('id', patient.id);
            
          if (updateError) {
            console.error(`❌ Erro ao atualizar paciente ${patient.id}:`, updateError.message);
          } else {
            console.log(`✅ Paciente ${patient.id} traduzido`);
          }
        }
      }
    }
    
    console.log('\n🎉 Tradução concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verifique se todas as traduções foram aplicadas corretamente');
    console.log('2. Teste a aplicação para garantir compatibilidade');
    console.log('3. Execute: node check-database-structure.cjs para verificar os resultados');
    
  } catch (error) {
    console.error('❌ Erro geral durante a tradução:', error.message);
  }
}

// Executar o script
executeTranslations();