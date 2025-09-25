const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔗 Testando conexão com Supabase...');
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase.from('patients').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
}

async function createMedicalRecordsTable() {
  console.log('📋 Criando tabela medical_records...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS medical_records (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      chief_complaint TEXT,
      history_present_illness TEXT,
      past_medical_history TEXT,
      medications TEXT,
      allergies TEXT,
      social_history TEXT,
      family_history TEXT,
      review_systems TEXT,
      physical_examination TEXT,
      assessment_plan TEXT,
      notes TEXT,
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    // Usar uma query direta para criar a tabela
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });
    
    if (response.ok) {
      console.log('✅ Tabela medical_records criada com sucesso!');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Erro ao criar tabela:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando migração simplificada...\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Não foi possível conectar ao Supabase. Verifique as credenciais.');
    return;
  }
  
  await createMedicalRecordsTable();
  
  console.log('\n🎉 Migração concluída!');
  console.log('📝 Próximos passos:');
  console.log('   1. Acesse o Supabase Dashboard');
  console.log('   2. Vá para SQL Editor');
  console.log('   3. Execute o arquivo create-medical-records-tables.sql manualmente');
}

main();