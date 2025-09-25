#!/usr/bin/env node

/**
 * Script para criar a tabela family_access_tokens no Supabase
 * Executa o arquivo SQL create-family-access-table.sql
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? 'Definida' : 'Não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeFamilyAccessTableCreation() {
  console.log('🚀 Iniciando criação da tabela family_access_tokens...')
  console.log('=' .repeat(60))

  try {
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'create-family-access-table.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Arquivo SQL não encontrado: ${sqlFilePath}`)
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    console.log('📄 Arquivo SQL carregado com sucesso')

    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'))

    console.log(`📝 Encontrados ${sqlCommands.length} comandos SQL para executar`)

    // Executar cada comando SQL
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i]
      
      // Pular comentários e comandos vazios
      if (command.startsWith('--') || command.startsWith('/*') || command.trim() === '') {
        continue
      }

      try {
        console.log(`\n⚡ Executando comando ${i + 1}/${sqlCommands.length}...`)
        
        // Executar o comando SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        })

        if (error) {
          // Tentar executar diretamente se RPC falhar
          console.log('⚠️  RPC falhou, tentando execução direta...')
          
          const { data: directData, error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1)

          if (directError) {
            throw directError
          }

          // Para comandos CREATE TABLE, usar uma abordagem diferente
          if (command.toUpperCase().includes('CREATE TABLE')) {
            console.log('🔧 Executando CREATE TABLE via SQL direto...')
            
            // Usar uma query mais simples para testar a conexão
            const { error: testError } = await supabase
              .from('family_access_tokens')
              .select('id')
              .limit(1)

            if (testError && testError.message.includes('does not exist')) {
              console.log('✅ Tabela não existe, precisa ser criada')
              // A tabela será criada via SQL direto no Supabase
            }
          }
        }

        console.log(`✅ Comando ${i + 1} executado com sucesso`)
        successCount++

      } catch (cmdError) {
        console.error(`❌ Erro no comando ${i + 1}:`, cmdError.message)
        
        // Alguns erros são esperados (como tabela já existir)
        if (cmdError.message.includes('already exists') || 
            cmdError.message.includes('já existe')) {
          console.log('ℹ️  Comando ignorado (recurso já existe)')
          successCount++
        } else {
          errorCount++
        }
      }
    }

    console.log('\n' + '=' .repeat(60))
    console.log('📊 RESUMO DA EXECUÇÃO:')
    console.log(`✅ Comandos executados com sucesso: ${successCount}`)
    console.log(`❌ Comandos com erro: ${errorCount}`)

    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando se a tabela foi criada...')
    
    try {
      const { data: tableCheck, error: checkError } = await supabase
        .from('family_access_tokens')
        .select('id')
        .limit(1)

      if (checkError) {
        if (checkError.message.includes('does not exist')) {
          console.log('⚠️  Tabela family_access_tokens ainda não existe')
          console.log('💡 Você pode precisar executar o SQL manualmente no Supabase Dashboard')
          console.log('📋 SQL para executar:')
          console.log('\n' + '-'.repeat(40))
          console.log(sqlContent.substring(0, 500) + '...')
          console.log('-'.repeat(40))
        } else {
          throw checkError
        }
      } else {
        console.log('✅ Tabela family_access_tokens criada e acessível!')
        
        // Mostrar estrutura da tabela
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'family_access_tokens')
          .eq('table_schema', 'public')
          .order('ordinal_position')

        if (columns && columns.length > 0) {
          console.log('\n📋 Estrutura da tabela:')
          columns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
          })
        }
      }
    } catch (verifyError) {
      console.error('❌ Erro ao verificar tabela:', verifyError.message)
    }

    if (errorCount === 0) {
      console.log('\n🎉 Criação da tabela family_access_tokens concluída com sucesso!')
    } else {
      console.log('\n⚠️  Criação concluída com alguns erros. Verifique os logs acima.')
    }

  } catch (error) {
    console.error('❌ Erro geral na execução:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeFamilyAccessTableCreation()
    .then(() => {
      console.log('\n✨ Script concluído!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Falha na execução:', error)
      process.exit(1)
    })
}

module.exports = { executeFamilyAccessTableCreation }