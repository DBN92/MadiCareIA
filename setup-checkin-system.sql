-- Script para configurar sistema de check-in/check-out
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar campos de endereço na tabela patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. Criar tabela para registros de check-in/check-out
CREATE TABLE IF NOT EXISTS checkin_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('check_in', 'check_out')) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  distance_to_patient DECIMAL(10, 2), -- distância em metros
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS na tabela checkin_records
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para checkin_records
-- Usuários podem ver seus próprios registros
CREATE POLICY "Users can view own checkin records" ON checkin_records
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios registros
CREATE POLICY "Users can insert own checkin records" ON checkin_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios registros
CREATE POLICY "Users can update own checkin records" ON checkin_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem ver todos os registros
CREATE POLICY "Admins can view all checkin records" ON checkin_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Criar função para calcular distância entre dois pontos (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  earth_radius CONSTANT DECIMAL := 6371000; -- Raio da Terra em metros
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Converter graus para radianos
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Fórmula de Haversine
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para calcular distância automaticamente
CREATE OR REPLACE FUNCTION calculate_checkin_distance()
RETURNS TRIGGER AS $$
DECLARE
  patient_lat DECIMAL(10, 8);
  patient_lon DECIMAL(11, 8);
BEGIN
  -- Buscar coordenadas do paciente
  SELECT latitude, longitude INTO patient_lat, patient_lon
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Calcular distância se ambas as coordenadas existirem
  IF patient_lat IS NOT NULL AND patient_lon IS NOT NULL 
     AND NEW.location_latitude IS NOT NULL AND NEW.location_longitude IS NOT NULL THEN
    NEW.distance_to_patient := calculate_distance(
      NEW.location_latitude,
      NEW.location_longitude,
      patient_lat,
      patient_lon
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para executar o cálculo de distância
DROP TRIGGER IF EXISTS calculate_distance_trigger ON checkin_records;
CREATE TRIGGER calculate_distance_trigger
  BEFORE INSERT OR UPDATE ON checkin_records
  FOR EACH ROW EXECUTE FUNCTION calculate_checkin_distance();

-- 8. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_checkin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_checkin_updated_at_trigger ON checkin_records;
CREATE TRIGGER update_checkin_updated_at_trigger
  BEFORE UPDATE ON checkin_records
  FOR EACH ROW EXECUTE FUNCTION update_checkin_updated_at();

-- 10. Inserir dados de exemplo para alguns pacientes (endereços fictícios)
UPDATE patients SET 
  address = 'Rua das Flores, 123',
  city = 'São Paulo',
  state = 'SP',
  zip_code = '01234-567',
  latitude = -23.5505,
  longitude = -46.6333
WHERE full_name LIKE '%João%' OR full_name LIKE '%Maria%';

-- 11. Comentários sobre o funcionamento
/*
Este script configura:

1. Campos de endereço na tabela patients (address, city, state, zip_code, latitude, longitude)
2. Tabela checkin_records para armazenar registros de check-in/check-out
3. Políticas RLS para segurança dos dados
4. Função para calcular distância entre usuário e paciente
5. Triggers automáticos para calcular distância e atualizar timestamps
6. Dados de exemplo para testes

Funcionalidades implementadas:
- Check-in/check-out com geolocalização
- Cálculo automático de distância até o paciente
- Registro de endereço e coordenadas
- Controle de acesso por usuário
- Auditoria completa com timestamps

IMPORTANTE: Execute este script completo no SQL Editor do Supabase Dashboard
*/