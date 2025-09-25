-- ETAPA 2: Migração dos dados de 'mood' para 'humor'
-- Execute APENAS após ter executado com sucesso a ETAPA 1

-- Migrar registros existentes de 'mood' para 'humor'
UPDATE events 
SET type = 'humor'::event_type 
WHERE type = 'mood'::event_type;

-- Verificar a migração
SELECT type, COUNT(*) as count 
FROM events 
GROUP BY type 
ORDER BY type;

-- Verificar registros específicos migrados
SELECT id, type, created_at, mood_scale, mood_notes
FROM events 
WHERE type = 'humor'::event_type
ORDER BY created_at DESC
LIMIT 5;

-- Verificar se ainda existem registros com 'mood'
SELECT COUNT(*) as remaining_mood_records
FROM events 
WHERE type = 'mood'::event_type;