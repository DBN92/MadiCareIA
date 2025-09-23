-- Adicionar coluna admission_date na tabela patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS admission_date DATE;