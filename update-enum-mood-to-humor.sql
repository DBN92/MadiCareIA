-- Script para atualizar o enum event_type de 'mood' para 'humor'

-- 1. Primeiro, adicionar 'humor' ao enum event_type
ALTER TYPE event_type ADD VALUE 'humor';

-- 2. Atualizar todos os registros de 'mood' para 'humor'
UPDATE events SET type = 'humor' WHERE type = 'mood';

-- 3. Verificar se ainda existem registros com 'mood'
SELECT COUNT(*) as mood_count FROM events WHERE type = 'mood';

-- 4. Verificar registros com 'humor'
SELECT COUNT(*) as humor_count FROM events WHERE type = 'humor';

-- 5. Mostrar todos os tipos de eventos únicos
SELECT DISTINCT type FROM events ORDER BY type;

-- Nota: Para remover 'mood' do enum completamente, seria necessário:
-- 1. Criar um novo enum sem 'mood'
-- 2. Alterar a coluna para usar o novo enum
-- 3. Remover o enum antigo
-- Isso é mais complexo e pode ser feito posteriormente se necessário.