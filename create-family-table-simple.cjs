#!/usr/bin/env node

/**
 * Script simplificado para criar a tabela family_access_tokens
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createFamilyAccessTable() {
  console.log('🚀 Criando tabela family_access_tokens...')
  
  try {
    // Primeiro, vamos verificar se a tabela já existe
    console.log('🔍 Verificando se a tabela já existe...')
    
    const { data: existingTable, error: checkError } = await supabase
      .from('family_access_tokens')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Tabela family_access_tokens já existe!')
      
      // Mostrar alguns dados da tabela se existir
      const { data: tableData, error: dataError } = await supabase
        .from('family_access_tokens')
        .select('*')
        .limit(3)

      if (!dataError) {
        console.log(`📊 Tabela contém ${tableData.length} registros`)
        if (tableData.length > 0) {
          console.log('📋 Exemplo de registro:')
          console.log(JSON.stringify(tableData[0], null, 2))
        }
      }
      
      return true
    }

    if (checkError && !checkError.message.includes('does not exist')) {
      throw checkError
    }

    console.log('📝 Tabela não existe, será necessário criá-la manualmente no Supabase Dashboard')
    console.log('\n' + '='.repeat(80))
    console.log('📋 INSTRUÇÕES PARA CRIAR A TABELA MANUALMENTE:')
    console.log('='.repeat(80))
    console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. Vá para o seu projeto')
    console.log('3. Clique em "SQL Editor" no menu lateral')
    console.log('4. Cole e execute o seguinte SQL:')
    console.log('\n' + '-'.repeat(40))
    
    const createTableSQL = `
-- Criar tabela family_access_tokens
CREATE TABLE IF NOT EXISTS public.family_access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    username TEXT,
    password TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
    permissions JSONB DEFAULT '{"canView": true, "canEdit": false}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_name TEXT,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_patient_id ON public.family_access_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_token ON public.family_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_active ON public.family_access_tokens(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE public.family_access_tokens ENABLE ROW LEVEL SECURITY;

-- Política para acesso público aos tokens válidos (para validação familiar)
CREATE POLICY "Public can validate active family tokens" ON public.family_access_tokens
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Política para usuários autenticados verem tokens de seus pacientes
CREATE POLICY "Users can manage family tokens for their patients" ON public.family_access_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = family_access_tokens.patient_id 
            AND patients.created_by = auth.uid()
        )
    );
`

    console.log(createTableSQL)
    console.log('-'.repeat(40))
    console.log('\n5. Após executar o SQL, execute este script novamente para verificar')
    console.log('='.repeat(80))

    // Salvar o SQL em um arquivo para facilitar
    const fs = require('fs')
    fs.writeFileSync('family-access-table-manual.sql', createTableSQL)
    console.log('\n💾 SQL salvo em: family-access-table-manual.sql')
    
    return false

  } catch (error) {
    console.error('❌ Erro:', error.message)
    return false
  }
}

// Executar
if (require.main === module) {
  createFamilyAccessTable()
    .then(success => {
      if (success) {
        console.log('\n🎉 Tabela family_access_tokens está pronta!')
      } else {
        console.log('\n⚠️  Tabela precisa ser criada manualmente')
      }
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Erro:', error)
      process.exit(1)
    })
}

module.exports = { createFamilyAccessTable }