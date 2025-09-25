-- Migração completa para suportar todos os tipos de cuidados
-- Adiciona colunas faltantes e atualiza enum event_type

-- 1. Primeiro, adicionar os novos valores ao enum event_type
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

-- 5. Adicionar constraints para validação dos dados

-- Constraints para medicação
ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_med_route 
  CHECK (med_route IN ('oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'rectal', 'sublingual'));

-- Constraints para dreno
ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_drain_type
  CHECK (drain_type IN ('chest', 'abdominal', 'wound', 'urinary', 'biliary', 'other'));

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_left_amount_positive
  CHECK (left_amount IS NULL OR left_amount >= 0);

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_right_amount_positive  
  CHECK (right_amount IS NULL OR right_amount >= 0);

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_left_aspect
  CHECK (left_aspect IN ('clear', 'bloody', 'purulent', 'serous', 'bilious', 'other'));

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_right_aspect
  CHECK (right_aspect IN ('clear', 'bloody', 'purulent', 'serous', 'bilious', 'other'));

-- Constraints para sinais vitais
ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_systolic_bp_range
  CHECK (systolic_bp IS NULL OR (systolic_bp >= 50 AND systolic_bp <= 300));

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_diastolic_bp_range
  CHECK (diastolic_bp IS NULL OR (diastolic_bp >= 30 AND diastolic_bp <= 200));

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_heart_rate_range
  CHECK (heart_rate IS NULL OR (heart_rate >= 30 AND heart_rate <= 250));

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_temperature_range
  CHECK (temperature IS NULL OR (temperature >= 30.0 AND temperature <= 45.0));

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_oxygen_saturation_range
  CHECK (oxygen_saturation IS NULL OR (oxygen_saturation >= 50 AND oxygen_saturation <= 100));

ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS check_respiratory_rate_range
  CHECK (respiratory_rate IS NULL OR (respiratory_rate >= 5 AND respiratory_rate <= 60));

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