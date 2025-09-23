// Script para criar um paciente de teste no Supabase
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestPatient() {
  try {
    console.log('Criando paciente de teste...')
    
    const testPatient = {
      full_name: 'João Silva Teste',
      birth_date: '1980-05-15',
      bed: 'Leito 101',
      notes: 'Paciente de teste para validação do sistema familiar',
      is_active: true
    }
    
    const { data, error } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar paciente:', error)
      return
    }
    
    console.log('Paciente criado com sucesso:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\nID do paciente:', data.id)
    
    return data
  } catch (err) {
    console.error('Erro:', err.message)
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestPatient()
}

export { createTestPatient }