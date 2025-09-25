-- Criação das tabelas para o módulo de prontuário médico
-- Este script cria a estrutura completa para gerenciar prontuários médicos

-- Tabela principal de prontuários médicos
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    chief_complaint TEXT, -- Queixa principal
    history_present_illness TEXT, -- História da doença atual
    past_medical_history TEXT, -- História médica pregressa
    medications TEXT, -- Medicações em uso
    allergies TEXT, -- Alergias
    social_history TEXT, -- História social
    family_history TEXT, -- História familiar
    review_systems TEXT, -- Revisão de sistemas
    physical_exam TEXT, -- Exame físico
    assessment TEXT, -- Avaliação/Impressão diagnóstica
    plan TEXT, -- Plano terapêutico
    notes TEXT, -- Observações gerais
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with TEXT[] DEFAULT '{}' -- Array de IDs de usuários com acesso
);

-- Tabela de diagnósticos
CREATE TABLE IF NOT EXISTS medical_diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    icd10_code VARCHAR(10), -- Código CID-10
    diagnosis_text TEXT NOT NULL,
    diagnosis_type VARCHAR(20) DEFAULT 'primary' CHECK (diagnosis_type IN ('primary', 'secondary', 'differential')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic')),
    onset_date DATE,
    resolution_date DATE,
    severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Tabela de prescrições médicas
CREATE TABLE IF NOT EXISTS medical_prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'cancelled', 'expired')),
    total_items INTEGER DEFAULT 0,
    notes TEXT,
    -- Integração com Memed
    memed_prescription_id VARCHAR(255), -- ID da prescrição no Memed
    memed_url TEXT, -- URL da prescrição no Memed
    memed_status VARCHAR(50), -- Status no Memed
    memed_created_at TIMESTAMP WITH TIME ZONE,
    memed_updated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de itens da prescrição
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id UUID NOT NULL REFERENCES medical_prescriptions(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL, -- Ex: "500mg"
    form TEXT, -- Ex: "comprimido", "cápsula", "xarope"
    frequency TEXT NOT NULL, -- Ex: "8/8h", "2x ao dia"
    duration TEXT, -- Ex: "7 dias", "uso contínuo"
    quantity TEXT, -- Quantidade a ser dispensada
    instructions TEXT, -- Instruções de uso
    generic_substitution BOOLEAN DEFAULT TRUE,
    urgent BOOLEAN DEFAULT FALSE,
    -- Dados do Memed
    memed_medication_id VARCHAR(255),
    memed_ean VARCHAR(20), -- Código de barras
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Tabela de exames solicitados
CREATE TABLE IF NOT EXISTS medical_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    exam_type VARCHAR(50) NOT NULL, -- "laboratory", "imaging", "procedure"
    exam_name TEXT NOT NULL,
    exam_code VARCHAR(20), -- Código TUSS ou similar
    indication TEXT, -- Indicação clínica
    urgency VARCHAR(20) DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'completed', 'cancelled')),
    requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
    scheduled_date DATE,
    completed_date DATE,
    result_text TEXT,
    result_file_url TEXT, -- URL do arquivo de resultado
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Tabela de anexos do prontuário
CREATE TABLE IF NOT EXISTS medical_record_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- "image", "pdf", "document"
    file_size INTEGER, -- Tamanho em bytes
    description TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de compartilhamento de prontuários
CREATE TABLE IF NOT EXISTS medical_record_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES profiles(id),
    shared_with UUID NOT NULL REFERENCES profiles(id),
    permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- Tabela de templates de prontuário
CREATE TABLE IF NOT EXISTS medical_record_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    specialty VARCHAR(100), -- Especialidade médica
    template_data JSONB NOT NULL, -- Estrutura do template
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_by ON medical_records(created_by);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_date ON medical_records(record_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);

CREATE INDEX IF NOT EXISTS idx_medical_diagnoses_record_id ON medical_diagnoses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_diagnoses_icd10 ON medical_diagnoses(icd10_code);

CREATE INDEX IF NOT EXISTS idx_medical_prescriptions_record_id ON medical_prescriptions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_prescriptions_patient_id ON medical_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_prescriptions_memed_id ON medical_prescriptions(memed_prescription_id);

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);

CREATE INDEX IF NOT EXISTS idx_medical_exams_record_id ON medical_exams(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_exams_patient_id ON medical_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_exams_status ON medical_exams(status);

CREATE INDEX IF NOT EXISTS idx_medical_record_attachments_record_id ON medical_record_attachments(medical_record_id);

CREATE INDEX IF NOT EXISTS idx_medical_record_shares_record_id ON medical_record_shares(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_shares_shared_with ON medical_record_shares(shared_with);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_prescriptions_updated_at 
    BEFORE UPDATE ON medical_prescriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_record_templates_updated_at 
    BEFORE UPDATE ON medical_record_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_templates ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de acesso (podem ser refinadas conforme necessário)
CREATE POLICY "Users can view medical records they created or have access to" ON medical_records
    FOR SELECT USING (
        created_by = auth.uid() OR 
        id IN (SELECT medical_record_id FROM medical_record_shares WHERE shared_with = auth.uid() AND is_active = true)
    );

CREATE POLICY "Users can create medical records" ON medical_records
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update medical records they created" ON medical_records
    FOR UPDATE USING (created_by = auth.uid());

-- Comentários nas tabelas
COMMENT ON TABLE medical_records IS 'Tabela principal para armazenar prontuários médicos completos';
COMMENT ON TABLE medical_diagnoses IS 'Diagnósticos associados aos prontuários médicos';
COMMENT ON TABLE medical_prescriptions IS 'Prescrições médicas com integração ao Memed';
COMMENT ON TABLE prescription_items IS 'Itens individuais das prescrições médicas';
COMMENT ON TABLE medical_exams IS 'Exames solicitados e resultados';
COMMENT ON TABLE medical_record_attachments IS 'Anexos dos prontuários (imagens, PDFs, etc.)';
COMMENT ON TABLE medical_record_shares IS 'Controle de compartilhamento de prontuários';
COMMENT ON TABLE medical_record_templates IS 'Templates reutilizáveis para prontuários';