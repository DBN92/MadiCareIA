const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatientsTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela patients...\n');
    
    // Tentar buscar informações da tabela usando information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'patients' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.log('❌ Erro ao buscar estrutura via RPC:', columnsError.message);
      
      // Tentar uma abordagem alternativa - buscar um registro da tabela
      console.log('🔄 Tentando abordagem alternativa...\n');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Erro ao buscar dados da tabela patients:', sampleError);
        return;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('✅ Estrutura da tabela patients (baseada em dados existentes):');
        console.log('Colunas encontradas:', Object.keys(sampleData[0]));
        console.log('\nDados de exemplo:');
        console.log(JSON.stringify(sampleData[0], null, 2));
      } else {
        console.log('⚠️ Tabela patients existe mas está vazia');
      }
    } else {
      console.log('✅ Estrutura da tabela patients:');
      console.table(columns);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkPatientsTableStructure();
