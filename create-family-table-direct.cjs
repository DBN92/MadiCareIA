const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzU2NzQsImV4cCI6MjA1MDU1MTY3NH0.example';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFamilyAccessTable() {
    console.log('🚀 Iniciando criação da tabela family_access_tokens...\n');

    try {
        // Primeiro, vamos tentar criar apenas a tabela básica
        const createTableSQL = `
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
        );`;

        console.log('📝 Criando tabela family_access_tokens...');
        const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (tableError) {
            console.log('❌ Erro ao criar tabela:', tableError.message);
            console.log('\n📋 SQL para execução manual no Supabase Dashboard:');
            console.log('=' .repeat(60));
            console.log(createTableSQL);
            console.log('=' .repeat(60));
            return;
        }

        console.log('✅ Tabela criada com sucesso!');

        // Criar índices
        const indexesSQL = [
            'CREATE INDEX IF NOT EXISTS idx_family_access_tokens_patient_id ON public.family_access_tokens(patient_id);',
            'CREATE INDEX IF NOT EXISTS idx_family_access_tokens_token ON public.family_access_tokens(token);',
            'CREATE INDEX IF NOT EXISTS idx_family_access_tokens_active ON public.family_access_tokens(is_active) WHERE is_active = true;',
            'CREATE INDEX IF NOT EXISTS idx_family_access_tokens_expires ON public.family_access_tokens(expires_at) WHERE expires_at IS NOT NULL;'
        ];

        console.log('\n📊 Criando índices...');
        for (const indexSQL of indexesSQL) {
            const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
            if (error) {
                console.log(`⚠️  Erro ao criar índice: ${error.message}`);
            } else {
                console.log('✅ Índice criado');
            }
        }

        // Habilitar RLS
        console.log('\n🔒 Habilitando Row Level Security...');
        const { error: rlsError } = await supabase.rpc('exec_sql', { 
            sql: 'ALTER TABLE public.family_access_tokens ENABLE ROW LEVEL SECURITY;' 
        });
        
        if (rlsError) {
            console.log('⚠️  Erro ao habilitar RLS:', rlsError.message);
        } else {
            console.log('✅ RLS habilitado');
        }

        // Verificar se a tabela foi criada
        console.log('\n🔍 Verificando criação da tabela...');
        const { data, error } = await supabase
            .from('family_access_tokens')
            .select('*')
            .limit(1);

        if (error) {
            console.log('❌ Erro ao verificar tabela:', error.message);
        } else {
            console.log('✅ Tabela family_access_tokens criada e acessível!');
            console.log('📊 Estrutura verificada com sucesso');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        
        // Mostrar SQL completo para execução manual
        const sqlFile = path.join(__dirname, 'create-family-access-table.sql');
        if (fs.existsSync(sqlFile)) {
            const sqlContent = fs.readFileSync(sqlFile, 'utf8');
            console.log('\n📋 Execute este SQL manualmente no Supabase Dashboard:');
            console.log('=' .repeat(80));
            console.log(sqlContent);
            console.log('=' .repeat(80));
        }
    }

    console.log('\n✨ Script concluído!');
}

// Executar o script
createFamilyAccessTable();