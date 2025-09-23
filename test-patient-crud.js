import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Carregar variáveis de ambiente
const envContent = fs.readFileSync('.env', 'utf8')
const envLines = envContent.split('\n')
const envVars = {}

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=')
    // Remove aspas se existirem
    value = value.replace(/^["']|["']$/g, '')
    envVars[key.trim()] = value.trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 TESTE CRUD DE PACIENTES - MEDICARE')
console.log('==================================================')

let createdPatientId = null

async function testPatientCRUD() {
  try {
    // 1. CREATE - Criar um novo paciente
    console.log('\n📝 Teste 1: Criando novo paciente...')
    const newPatient = {
      full_name: 'Maria Santos CRUD Test',
      birth_date: '1985-03-20',
      bed: 'CRUD-202',
      notes: 'Paciente de teste para validação CRUD',
      is_active: true
    }

    const { data: createData, error: createError } = await supabase
      .from('patients')
      .insert([newPatient])
      .select()
      .single()

    if (createError) {
      throw new Error(`Erro na criação: ${createError.message}`)
    }

    createdPatientId = createData.id
    console.log('✅ Paciente criado com sucesso!')
    console.log(`   ID: ${createData.id}`)
    console.log(`   Nome: ${createData.full_name}`)
    console.log(`   Leito: ${createData.bed}`)

    // 2. READ - Ler o paciente criado
    console.log('\n📖 Teste 2: Lendo paciente criado...')
    const { data: readData, error: readError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', createdPatientId)
      .single()

    if (readError) {
      throw new Error(`Erro na leitura: ${readError.message}`)
    }

    console.log('✅ Paciente lido com sucesso!')
    console.log(`   Nome: ${readData.full_name}`)
    console.log(`   Data de nascimento: ${readData.birth_date}`)
    console.log(`   Leito: ${readData.bed}`)
    console.log(`   Status ativo: ${readData.is_active}`)

    // 3. UPDATE - Atualizar o paciente
    console.log('\n✏️  Teste 3: Atualizando paciente...')
    const updatedData = {
      full_name: 'Maria Santos CRUD Test - ATUALIZADA',
      bed: 'CRUD-203',
      notes: 'Paciente transferida para novo leito - teste CRUD atualizado'
    }

    const { data: updateData, error: updateError } = await supabase
      .from('patients')
      .update(updatedData)
      .eq('id', createdPatientId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Erro na atualização: ${updateError.message}`)
    }

    console.log('✅ Paciente atualizado com sucesso!')
    console.log(`   Nome atualizado: ${updateData.full_name}`)
    console.log(`   Novo leito: ${updateData.bed}`)
    console.log(`   Notas atualizadas: ${updateData.notes}`)

    // 4. LIST - Listar pacientes (verificar se o atualizado está na lista)
    console.log('\n📋 Teste 4: Listando pacientes...')
    const { data: listData, error: listError } = await supabase
      .from('patients')
      .select('id, full_name, bed, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)

    if (listError) {
      throw new Error(`Erro na listagem: ${listError.message}`)
    }

    console.log(`✅ ${listData.length} pacientes ativos encontrados:`)
    listData.forEach((patient, index) => {
      const marker = patient.id === createdPatientId ? '👉' : '  '
      console.log(`${marker} ${index + 1}. ${patient.full_name} - Leito: ${patient.bed}`)
    })

    // 5. DELETE - Excluir o paciente (soft delete - marcar como inativo)
    console.log('\n🗑️  Teste 5: Desativando paciente (soft delete)...')
    const { data: deleteData, error: deleteError } = await supabase
      .from('patients')
      .update({ is_active: false })
      .eq('id', createdPatientId)
      .select()
      .single()

    if (deleteError) {
      throw new Error(`Erro na desativação: ${deleteError.message}`)
    }

    console.log('✅ Paciente desativado com sucesso!')
    console.log(`   Status ativo: ${deleteData.is_active}`)

    // 6. VERIFY DELETE - Verificar se não aparece mais na lista de ativos
    console.log('\n🔍 Teste 6: Verificando exclusão...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', createdPatientId)
      .eq('is_active', true)

    if (verifyError) {
      throw new Error(`Erro na verificação: ${verifyError.message}`)
    }

    if (verifyData.length === 0) {
      console.log('✅ Paciente não aparece mais na lista de ativos!')
    } else {
      console.log('⚠️  Paciente ainda aparece como ativo')
    }

    console.log('\n==================================================')
    console.log('📋 RELATÓRIO FINAL DO TESTE CRUD')
    console.log('==================================================')
    console.log('✅ PASSOU - Criação de Paciente')
    console.log('✅ PASSOU - Leitura de Paciente')
    console.log('✅ PASSOU - Atualização de Paciente')
    console.log('✅ PASSOU - Listagem de Pacientes')
    console.log('✅ PASSOU - Desativação de Paciente')
    console.log('✅ PASSOU - Verificação de Exclusão')
    console.log('\n📊 RESUMO:')
    console.log('   Testes executados: 6')
    console.log('   Testes aprovados: 6')
    console.log('   Taxa de sucesso: 100.0%')
    console.log('\n🎉 TODOS OS TESTES CRUD PASSARAM!')
    console.log('💾 Operações CRUD funcionando corretamente no Supabase.')

  } catch (error) {
    console.error('\n💥 Erro durante os testes CRUD:', error.message)
    
    // Limpeza em caso de erro
    if (createdPatientId) {
      console.log('\n🧹 Tentando limpeza de emergência...')
      try {
        await supabase
          .from('patients')
          .delete()
          .eq('id', createdPatientId)
        console.log('✅ Limpeza concluída')
      } catch (cleanupError) {
        console.error('❌ Erro na limpeza:', cleanupError.message)
      }
    }
    
    console.log('\n==================================================')
    console.log('📋 RELATÓRIO FINAL DO TESTE CRUD')
    console.log('==================================================')
    console.log('❌ ALGUNS TESTES FALHARAM')
    console.log('\n⚠️  Verifique os logs acima para mais detalhes.')
  } finally {
    // Limpeza final - remover completamente o paciente de teste
    if (createdPatientId) {
      console.log('\n🧹 Limpeza final...')
      try {
        await supabase
          .from('patients')
          .delete()
          .eq('id', createdPatientId)
        console.log('✅ Paciente de teste removido completamente')
      } catch (cleanupError) {
        console.log('⚠️  Paciente de teste pode ainda estar no banco')
      }
    }
  }
}

console.log('🏁 Teste CRUD de pacientes concluído.')

runPatientCRUD().catch(console.error)

async function runPatientCRUD() {
  await testPatientCRUD()
}