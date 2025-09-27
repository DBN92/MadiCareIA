#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSettingsHistoryTable() {
  console.log('🚀 Executando criação da tabela settings_history...')
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-settings-history-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Dividir em comandos individuais (separados por ponto e vírgula)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      console.log(`\n⏳ Executando comando ${i + 1}/${commands.length}...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        })
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message)
          
          // Para comandos CREATE TABLE, tentar abordagem alternativa
          if (command.toUpperCase().includes('CREATE TABLE')) {
            console.log('🔧 Tentando abordagem alternativa para CREATE TABLE...')
            console.log('📋 Execute este comando manualmente no Dashboard do Supabase:')
            console.log('---')
            console.log(command + ';')
            console.log('---')
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        }
      } catch (cmdError) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, cmdError.message)
        
        if (command.toUpperCase().includes('CREATE TABLE')) {
          console.log('📋 Execute este comando manualmente no Dashboard do Supabase:')
          console.log('---')
          console.log(command + ';')
          console.log('---')
        }
      }
    }
    
    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando se a tabela foi criada...')
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'settings_history')
    
    if (checkError) {
      console.error('❌ Erro ao verificar tabela:', checkError.message)
    } else if (tables && tables.length > 0) {
      console.log('✅ Tabela settings_history criada com sucesso!')
      
      // Testar inserção de dados
      console.log('\n🧪 Testando inserção de dados...')
      const testData = {
        version_id: 'v1.0.0',
        version_name: 'Versão inicial',
        settings_type: 'chat',
        settings_data: {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 1000
        },
        description: 'Configurações iniciais do sistema de chat',
        is_active: true,
        tags: ['initial', 'stable']
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('settings_history')
        .insert(testData)
        .select()
      
      if (insertError) {
        console.error('❌ Erro ao inserir dados de teste:', insertError.message)
      } else {
        console.log('✅ Dados de teste inseridos com sucesso!')
        console.log('📊 Dados inseridos:', insertData)
        
        // Limpar dados de teste
        await supabase
          .from('settings_history')
          .delete()
          .eq('version_id', 'v1.0.0')
        
        console.log('🧹 Dados de teste removidos')
      }
    } else {
      console.log('⚠️ Tabela não encontrada. Execute os comandos manualmente no Dashboard do Supabase.')
    }
    
    console.log('\n🎉 Processo concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
    console.log('\n📋 Se houver problemas, execute o SQL manualmente no Dashboard do Supabase:')
    console.log('Arquivo: create-settings-history-table.sql')
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeSettingsHistoryTable()
}

module.exports = { executeSettingsHistoryTable }