-- Atualização do schema da tabela events para suportar todos os tipos de cuidados detalhados
-- Este script adiciona campos específicos para cada tipo de cuidado registrado no formulário

-- 1. Adicionar novos tipos de eventos
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'medication';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'drain';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vital_signs';

-- 2. Adicionar campos para medicamentos
ALTER TABLE events ADD COLUMN IF NOT EXISTS medication_name VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS dosage VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS route VARCHAR(100);

-- 3. Adicionar campos para drenos
ALTER TABLE events ADD COLUMN IF NOT EXISTS drain_type VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS left_amount INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS right_amount INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS left_aspect VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS right_aspect VARCHAR(255);

-- 4. Adicionar campos para sinais vitais
ALTER TABLE events ADD COLUMN IF NOT EXISTS systolic_bp INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS diastolic_bp INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS heart_rate INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS temperature DECIMAL(4,1);
ALTER TABLE events ADD COLUMN IF NOT EXISTS oxygen_saturation INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER;

-- 5. Adicionar campos adicionais para melhor rastreamento
ALTER TABLE events ADD COLUMN IF NOT EXISTS liquid_type VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS meal_type VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS consumption_percentage INTEGER;

-- 6. Criar índices para melhor performance nas consultas do assistente
CREATE INDEX IF NOT EXISTS idx_events_type_occurred_at ON events(type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_patient_type ON events(patient_id, type);
CREATE INDEX IF NOT EXISTS idx_events_medication_name ON events(medication_name) WHERE medication_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_liquid_type ON events(liquid_type) WHERE liquid_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_meal_type ON events(meal_type) WHERE meal_type IS NOT NULL;

-- 7. Comentários para documentação
COMMENT ON COLUMN events.medication_name IS 'Nome do medicamento administrado';
COMMENT ON COLUMN events.dosage IS 'Dosagem do medicamento (ex: 500mg, 2 comprimidos)';
COMMENT ON COLUMN events.route IS 'Via de administração (oral, IV, IM, etc.)';
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
COMMENT ON COLUMN events.liquid_type IS 'Tipo específico de líquido (água, suco, etc.)';
COMMENT ON COLUMN events.meal_type IS 'Tipo específico de refeição (café, almoço, etc.)';
COMMENT ON COLUMN events.consumption_percentage IS 'Percentual consumido da refeição';