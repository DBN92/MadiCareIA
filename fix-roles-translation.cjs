const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRolesTranslation() {
  console.log('🔧 Corrigindo tradução das funções...\n');
  
  try {
    // Buscar todos os perfis com role 'doctor'
    const { data: doctors, error: doctorsError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'doctor');
      
    if (doctorsError) {
      console.error('❌ Erro ao buscar doctors:', doctorsError.message);
      return;
    }
    
    console.log(`👨‍⚕️ Encontrados ${doctors?.length || 0} perfis com role 'doctor'`);
    
    // Atualizar cada perfil individualmente
    for (const doctor of doctors || []) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'medico' })
        .eq('id', doctor.id)
        .select();
        
      if (error) {
        console.error(`❌ Erro ao atualizar ${doctor.full_name}:`, error.message);
      } else {
        console.log(`✅ ${doctor.full_name}: 'doctor' → 'medico'`);
      }
    }
    
    // Verificar outras roles que possam existir
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('role')
      .not('role', 'eq', 'medico');
      
    if (!allError && allProfiles && allProfiles.length > 0) {
      console.log('\n🔍 Outras funções encontradas:');
      const uniqueRoles = [...new Set(allProfiles.map(p => p.role))];
      
      for (const role of uniqueRoles) {
        let translatedRole = role;
        
        switch (role) {
          case 'nurse':
            translatedRole = 'enfermeiro';
            break;
          case 'admin':
            translatedRole = 'administrador';
            break;
          case 'patient':
            translatedRole = 'paciente';
            break;
          case 'receptionist':
            translatedRole = 'recepcionista';
            break;
        }
        
        if (translatedRole !== role) {
          const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update({ role: translatedRole })
            .eq('role', role)
            .select();
            
          if (updateError) {
            console.error(`❌ Erro ao traduzir role '${role}':`, updateError.message);
          } else {
            console.log(`✅ Traduzido ${updated?.length || 0} registros: '${role}' → '${translatedRole}'`);
          }
        }
      }
    }
    
    console.log('\n🎉 Correção das funções concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
fixRolesTranslation();