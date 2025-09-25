const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceRolesUpdate() {
  console.log('🔧 Forçando atualização das funções...\n');
  
  try {
    // Buscar todos os perfis
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*');
      
    if (fetchError) {
      console.error('❌ Erro ao buscar perfis:', fetchError.message);
      return;
    }
    
    console.log(`👥 Encontrados ${allProfiles?.length || 0} perfis para atualizar`);
    
    // Atualizar cada perfil individualmente
    for (const profile of allProfiles || []) {
      console.log(`\n🔄 Processando: ${profile.full_name} (${profile.role})`);
      
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
      
      // Traduzir nome se necessário
      if (profile.full_name.includes('Dr. Teste Auth')) {
        newName = profile.full_name.replace('Dr. Teste Auth', 'Dr. Teste Autenticação');
      }
      
      // Fazer update se houver mudanças
      if (newRole !== profile.role || newName !== profile.full_name) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: newRole,
            full_name: newName
          })
          .eq('id', profile.id)
          .select();
          
        if (updateError) {
          console.error(`❌ Erro ao atualizar:`, updateError.message);
          console.error('Detalhes do erro:', updateError);
        } else {
          console.log(`✅ Atualizado com sucesso:`);
          console.log(`   Nome: ${profile.full_name} → ${newName}`);
          console.log(`   Função: ${profile.role} → ${newRole}`);
        }
      } else {
        console.log(`ℹ️ Nenhuma alteração necessária`);
      }
    }
    
    // Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('id, full_name, role');
      
    if (!finalError && finalProfiles) {
      console.log('\n📋 Estado final dos perfis:');
      finalProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.full_name} - ${profile.role}`);
      });
    }
    
    console.log('\n🎉 Atualização forçada concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o script
forceRolesUpdate();