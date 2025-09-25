-- Script para adicionar 'humor' ao enum event_type e migrar dados
-- Execute este script diretamente no SQL Editor do Supabase
-- IMPORTANTE: Execute em duas etapas separadas devido à limitação do PostgreSQL

-- ETAPA 1: Adicionar 'humor' ao enum event_type
ALTER TYPE event_type ADD VALUE 'humor';

-- Verificar se foi adicionado
SELECT unnest(enum_range(NULL::event_type)) as event_types;

-- COMMIT é necessário antes de usar o novo valor
COMMIT;

-- ETAPA 2: Execute este bloco SEPARADAMENTE após a ETAPA 1
-- Migrar registros existentes de 'mood' para 'humor'
-- UPDATE events 
-- SET type = 'humor'::event_type 
-- WHERE type = 'mood'::event_type;

-- Verificar a migração
-- SELECT type, COUNT(*) as count 
-- FROM events 
-- GROUP BY type 
-- ORDER BY type;

-- Verificar registros específicos migrados
-- SELECT id, type, created_at, mood_scale, mood_notes
-- FROM events 
-- WHERE type = 'humor'::event_type
-- ORDER BY created_at DESC
-- LIMIT 5;