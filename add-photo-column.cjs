const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://envqimsupjgovuofbghj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU";

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPhotoColumn() {
  try {
    // Tentar adicionar a coluna photo
    const { data, error } = await supabase
      .from('patients')
      .select('photo')
      .limit(1);
    
    if (error && error.message.includes('column "photo" does not exist')) {
      console.log('Coluna photo não existe. Será necessário adicionar via SQL direto no Supabase.');
      console.log('Execute o seguinte comando no SQL Editor do Supabase:');
      console.log('ALTER TABLE patients ADD COLUMN photo TEXT;');
    } else if (error) {
      console.error('Erro ao verificar coluna:', error);
    } else {
      console.log('Coluna photo já existe na tabela patients!');
    }
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

addPhotoColumn();