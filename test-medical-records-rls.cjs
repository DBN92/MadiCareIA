const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ixqjqfkzqvqwqjqjqjqj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZmt6cXZxd3FqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzY5NzAsImV4cCI6MjA1MDU1Mjk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
);

async function testMedicalRecordsRLS() {
  console.log('🔍 Testando políticas RLS da tabela medical_records...\n');
  
  try {
    // 1. Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Erro ao obter usuário:', userError.message);
      return;
    }
    
    if (!user) {
      console.log('❌ Usuário não autenticado');
      console.log('💡 Faça login na aplicação primeiro');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.id);
    console.log('📧 Email:', user.email);
    
    // 2. Verificar se consegue acessar a tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao acessar profile:', profileError.message);
    } else {
      console.log('✅ Profile encontrado:', profile.full_name || 'Nome não definido');
    }
    
    // 3. Verificar se existem pacientes para usar no teste
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(1);
    
    if (patientsError) {
      console.log('❌ Erro ao buscar pacientes:', patientsError.message);
      return;
    }
    
    if (!patients || patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado para teste');
      console.log('💡 Crie um paciente primeiro na aplicação');
      return;
    }
    
    const testPatient = patients[0];
    console.log('✅ Paciente para teste:', testPatient.full_name);
    
    // 4. Testar inserção na tabela medical_records
    const testRecord = {
      patient_id: testPatient.id,
      doctor_id: user.id,
      record_date: new Date().toISOString().split('T')[0],
      chief_complaint: 'Teste de inserção RLS',
      status: 'draft'
    };
    
    console.log('\n🧪 Testando inserção na tabela medical_records...');
    console.log('📋 Dados do teste:', {
      patient_id: testRecord.patient_id,
      doctor_id: testRecord.doctor_id,
      record_date: testRecord.record_date
    });
    
    const { data: insertData, error: insertError } = await supabase
      .from('medical_records')
      .insert(testRecord)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('📋 Código do erro:', insertError.code);
      console.log('💡 Detalhes:', insertError.details);
      console.log('🔍 Hint:', insertError.hint);
      
      if (insertError.code === '42501') {
        console.log('\n🚨 PROBLEMA IDENTIFICADO: Violação de política RLS');
        console.log('🔧 Possíveis soluções:');
        console.log('   1. Verificar se as políticas RLS estão corretas');
        console.log('   2. Verificar se o auth.uid() está funcionando');
        console.log('   3. Verificar se o usuário tem o role correto');
      }
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📄 ID do registro:', insertData.id);
      
      // 5. Testar se consegue ler o registro criado
      const { data: readData, error: readError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('id', insertData.id)
        .single();
      
      if (readError) {
        console.log('❌ Erro ao ler registro:', readError.message);
      } else {
        console.log('✅ Leitura bem-sucedida');
      }
      
      // 6. Limpar o registro de teste
      const { error: deleteError } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.log('⚠️ Erro ao remover registro de teste:', deleteError.message);
      } else {
        console.log('🧹 Registro de teste removido');
      }
    }
    
    // 7. Verificar políticas RLS existentes
    console.log('\n🔍 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = 'medical_records'
          ORDER BY policyname;
        `
      });
    
    if (policiesError) {
      console.log('❌ Erro ao verificar políticas:', policiesError.message);
    } else if (policies && policies.length > 0) {
      console.log('📋 Políticas RLS encontradas:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('⚠️ Nenhuma política RLS encontrada');
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

testMedicalRecordsRLS();