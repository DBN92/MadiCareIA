-- Migração Simplificada - Apenas adiciona colunas e enum values
-- Execute este script primeiro no Supabase SQL Editor

-- 1. Adicionar novos valores ao enum event_type
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'medication';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'drain';  
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vital_signs';

-- 2. Adicionar colunas para medicação
ALTER TABLE events ADD COLUMN IF NOT EXISTS med_route TEXT;

-- 3. Adicionar colunas para dreno
ALTER TABLE events ADD COLUMN IF NOT EXISTS drain_type TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS left_amount INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS right_amount INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS left_aspect TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS right_aspect TEXT;

-- 4. Adicionar colunas para sinais vitais
ALTER TABLE events ADD COLUMN IF NOT EXISTS systolic_bp INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS diastolic_bp INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS heart_rate INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS temperature DECIMAL(4,1);
ALTER TABLE events ADD COLUMN IF NOT EXISTS oxygen_saturation INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER;

-- 5. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_events_med_route ON events(med_route) WHERE med_route IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_drain_type ON events(drain_type) WHERE drain_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_vital_signs ON events(systolic_bp, diastolic_bp, heart_rate) WHERE systolic_bp IS NOT NULL;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN (
    'med_route', 'drain_type', 'left_amount', 'right_amount', 
    'left_aspect', 'right_aspect', 'systolic_bp', 'diastolic_bp', 
    'heart_rate', 'temperature', 'oxygen_saturation', 'respiratory_rate'
  )
ORDER BY column_name;