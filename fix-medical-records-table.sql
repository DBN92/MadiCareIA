-- Script para criar a tabela medical_records
-- Execute este script no Supabase Dashboard > SQL Editor

-- Criar a tabela medical_records
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    chief_complaint TEXT,
    history_present_illness TEXT,
    past_medical_history TEXT,
    medications TEXT,
    allergies TEXT,
    social_history TEXT,
    family_history TEXT,
    review_systems TEXT,
    physical_examination TEXT,
    assessment_plan TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_date ON public.medical_records(record_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON public.medical_records(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas de acesso
CREATE POLICY "Users can view medical records they created" ON public.medical_records
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Users can create medical records" ON public.medical_records
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Users can update medical records they created" ON public.medical_records
    FOR UPDATE USING (doctor_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON public.medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();