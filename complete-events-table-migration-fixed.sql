-- Migração completa para suportar todos os tipos de cuidados
-- Adiciona colunas faltantes e atualiza enum event_type
-- VERSÃO CORRIGIDA - Remove IF NOT EXISTS das constraints

-- 1. Primeiro, adicionar os novos valores ao enum event_type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'event_type' AND e.enumlabel = 'medication') THEN
        ALTER TYPE event_type ADD VALUE 'medication';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'event_type' AND e.enumlabel = 'drain') THEN
        ALTER TYPE event_type ADD VALUE 'drain';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'event_type' AND e.enumlabel = 'vital_signs') THEN
        ALTER TYPE event_type ADD VALUE 'vital_signs';
    END IF;
END $$;

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

-- 5. Adicionar constraints para validação dos dados (sem IF NOT EXISTS)

-- Constraints para medicação
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_med_route') THEN
        ALTER TABLE events ADD CONSTRAINT check_med_route 
        CHECK (med_route IN ('oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'rectal', 'sublingual'));
    END IF;
END $$;

-- Constraints para dreno
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_drain_type') THEN
        ALTER TABLE events ADD CONSTRAINT check_drain_type
        CHECK (drain_type IN ('chest', 'abdominal', 'wound', 'urinary', 'biliary', 'other'));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_left_amount_positive') THEN
        ALTER TABLE events ADD CONSTRAINT check_left_amount_positive
        CHECK (left_amount IS NULL OR left_amount >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_right_amount_positive') THEN
        ALTER TABLE events ADD CONSTRAINT check_right_amount_positive  
        CHECK (right_amount IS NULL OR right_amount >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_left_aspect') THEN
        ALTER TABLE events ADD CONSTRAINT check_left_aspect
        CHECK (left_aspect IN ('clear', 'bloody', 'purulent', 'serous', 'bilious', 'other'));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_right_aspect') THEN
        ALTER TABLE events ADD CONSTRAINT check_right_aspect
        CHECK (right_aspect IN ('clear', 'bloody', 'purulent', 'serous', 'bilious', 'other'));
    END IF;
END $$;

-- Constraints para sinais vitais
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_systolic_bp_range') THEN
        ALTER TABLE events ADD CONSTRAINT check_systolic_bp_range
        CHECK (systolic_bp IS NULL OR (systolic_bp >= 50 AND systolic_bp <= 300));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_diastolic_bp_range') THEN
        ALTER TABLE events ADD CONSTRAINT check_diastolic_bp_range
        CHECK (diastolic_bp IS NULL OR (diastolic_bp >= 30 AND diastolic_bp <= 200));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_heart_rate_range') THEN
        ALTER TABLE events ADD CONSTRAINT check_heart_rate_range
        CHECK (heart_rate IS NULL OR (heart_rate >= 30 AND heart_rate <= 250));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_temperature_range') THEN
        ALTER TABLE events ADD CONSTRAINT check_temperature_range
        CHECK (temperature IS NULL OR (temperature >= 30.0 AND temperature <= 45.0));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_oxygen_saturation_range') THEN
        ALTER TABLE events ADD CONSTRAINT check_oxygen_saturation_range
        CHECK (oxygen_saturation IS NULL OR (oxygen_saturation >= 50 AND oxygen_saturation <= 100));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_respiratory_rate_range') THEN
        ALTER TABLE events ADD CONSTRAINT check_respiratory_rate_range
        CHECK (respiratory_rate IS NULL OR (respiratory_rate >= 5 AND respiratory_rate <= 60));
    END IF;
END $$;

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_events_med_route ON events(med_route) WHERE med_route IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_drain_type ON events(drain_type) WHERE drain_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_vital_signs ON events(systolic_bp, diastolic_bp, heart_rate) WHERE systolic_bp IS NOT NULL;

-- 7. Comentários para documentação
COMMENT ON COLUMN events.med_route IS 'Via de administração da medicação';
COMMENT ON COLUMN events.drain_type IS 'Tipo de dreno (torácico, abdominal, etc.)';
COMMENT ON COLUMN events.left_amount IS 'Volume drenado lado esquerdo (ml)';
COMMENT ON COLUMN events.right_amount IS 'Volume drenado lado direito (ml)';
COMMENT ON COLUMN events.left_aspect IS 'Aspecto do líquido drenado lado esquerdo';
COMMENT ON COLUMN events.right_aspect IS 'Aspecto do líquido drenado lado direito';
COMMENT ON COLUMN events.systolic_bp IS 'Pressão arterial sistólica (mmHg)';
COMMENT ON COLUMN events.diastolic_bp IS 'Pressão arterial diastólica (mmHg)';
COMMENT ON COLUMN events.heart_rate IS 'Frequência cardíaca (bpm)';
COMMENT ON COLUMN events.temperature IS 'Temperatura corporal (°C)';
COMMENT ON COLUMN events.oxygen_saturation IS 'Saturação de oxigênio (%)';
COMMENT ON COLUMN events.respiratory_rate IS 'Frequência respiratória (rpm)';

-- Verificar se a migração foi aplicada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN (
    'med_route', 'drain_type', 'left_amount', 'right_amount', 
    'left_aspect', 'right_aspect', 'systolic_bp', 'diastolic_bp', 
    'heart_rate', 'temperature', 'oxygen_saturation', 'respiratory_rate'
  )
ORDER BY column_name;