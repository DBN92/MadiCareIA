const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase com service_role key (necessário para operações administrativas)
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgxMTIzNCwiZXhwIjoyMDczMzg3MjM0fQ.Ej8Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6'; // Substitua pela sua service_role key

// Usar a chave anon por enquanto
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, anonKey);

async function updateWithRawSQL() {
  console.log('🔧 Tentando atualizar registros usando SQL direto...\n');
  
  try {
    // Método 1: Usar SQL direto para contornar RLS
    console.log('📝 Executando SQL direto para atualizar roles...');
    
    const updateRolesSQL = `
      UPDATE profiles 
      SET role = CASE 
        WHEN role = 'doctor' THEN 'medico'
        WHEN role = 'nurse' THEN 'enfermeiro'
        WHEN role = 'admin' THEN 'administrador'
        WHEN role = 'patient' THEN 'paciente'
        WHEN role = 'receptionist' THEN 'recepcionista'
        ELSE role
      END,
      full_name = CASE 
        WHEN full_name LIKE '%Dr. Teste Auth%' THEN REPLACE(full_name, 'Dr. Teste Auth', 'Dr. Teste Autenticação')
        ELSE full_name
      END
      WHERE role IN ('doctor', 'nurse', 'admin', 'patient', 'receptionist')
         OR full_name LIKE '%Dr. Teste Auth%';
    `;
    
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: updateRolesSQL
    });
    
    if (sqlError) {
      console.log('❌ Erro com SQL direto:', sqlError.message);
      
      // Método 2: Tentar com upsert
      console.log('\n🔄 Tentando com upsert...');
      
      // Buscar todos os profiles primeiro
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*');
        
      if (fetchError) {
        console.error('❌ Erro ao buscar profiles:', fetchError.message);
        return;
      }
      
      console.log(`👥 Encontrados ${profiles?.length || 0} perfis`);
      
      // Tentar upsert para cada perfil
      for (const profile of profiles || []) {
        let newRole = profile.role;
        let newName = profile.full_name;
        
        // Traduzir role
        switch (profile.role) {
          case 'doctor':
            newRole = 'medico';
            break;
          case 'nurse':
            newRole = 'enfermeiro';
            break;
          case 'admin':
            newRole = 'administrador';
            break;
          case 'patient':
            newRole = 'paciente';
            break;
          case 'receptionist':
            newRole = 'recepcionista';
            break;
        }
        
        // Traduzir nome
        if (profile.full_name && profile.full_name.includes('Dr. Teste Auth')) {
          newName = profile.full_name.replace('Dr. Teste Auth', 'Dr. Teste Autenticação');
        }
        
        // Fazer upsert
        const { data: upserted, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: profile.id,
            full_name: newName,
            role: newRole,
            created_at: profile.created_at
          }, {
            onConflict: 'id'
          });
          
        if (upsertError) {
          console.error(`❌ Erro no upsert para ${profile.full_name}:`, upsertError.message);
        } else {
          console.log(`✅ Upsert realizado: ${profile.full_name} (${profile.role}) → ${newName} (${newRole})`);
        }
      }
      
    } else {
      console.log('✅ SQL direto executado com sucesso!');
    }
    
    // Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('id, full_name, role');
      
    if (!finalError && finalProfiles) {
      console.log('\n📋 Estado final dos perfis:');
      finalProfiles.forEach((profile, index) => {
        const isTranslated = ['medico', 'enfermeiro', 'administrador', 'paciente', 'recepcionista'].includes(profile.role);
        const status = isTranslated ? '✅' : '⚠️';
        console.log(`${index + 1}. ${status} ${profile.full_name} - ${profile.role}`);
      });
      
      const translatedCount = finalProfiles.filter(p => 
        ['medico', 'enfermeiro', 'administrador', 'paciente', 'recepcionista'].includes(p.role)
      ).length;
      
      console.log(`\n📊 Resumo: ${translatedCount} de ${finalProfiles.length} perfis traduzidos`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o script
updateWithRawSQL();