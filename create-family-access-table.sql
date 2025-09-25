-- Criar tabela family_access_tokens para o sistema de acesso familiar
-- Baseado nos requisitos identificados no código do sistema MediCare

CREATE TABLE IF NOT EXISTS public.family_access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    username TEXT,
    password TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
    permissions JSONB DEFAULT '{"canView": true, "canEdit": false}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_name TEXT,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_patient_id ON public.family_access_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_token ON public.family_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_active ON public.family_access_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_expires ON public.family_access_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_family_access_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_family_access_tokens_updated_at
    BEFORE UPDATE ON public.family_access_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_family_access_tokens_updated_at();

-- Configurar RLS (Row Level Security)
ALTER TABLE public.family_access_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam apenas tokens de seus pacientes
CREATE POLICY "Users can view family tokens for their patients" ON public.family_access_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = family_access_tokens.patient_id 
            AND patients.created_by = auth.uid()
        )
    );

-- Política para permitir que usuários autenticados criem tokens para seus pacientes
CREATE POLICY "Users can create family tokens for their patients" ON public.family_access_tokens
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = family_access_tokens.patient_id 
            AND patients.created_by = auth.uid()
        )
    );

-- Política para permitir que usuários autenticados atualizem tokens de seus pacientes
CREATE POLICY "Users can update family tokens for their patients" ON public.family_access_tokens
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = family_access_tokens.patient_id 
            AND patients.created_by = auth.uid()
        )
    );

-- Política para permitir que usuários autenticados deletem tokens de seus pacientes
CREATE POLICY "Users can delete family tokens for their patients" ON public.family_access_tokens
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = family_access_tokens.patient_id 
            AND patients.created_by = auth.uid()
        )
    );

-- Política especial para permitir acesso público aos tokens válidos (para validação familiar)
CREATE POLICY "Public can validate active family tokens" ON public.family_access_tokens
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Comentários para documentação
COMMENT ON TABLE public.family_access_tokens IS 'Tabela para gerenciar tokens de acesso familiar aos dados dos pacientes';
COMMENT ON COLUMN public.family_access_tokens.id IS 'Identificador único do token';
COMMENT ON COLUMN public.family_access_tokens.patient_id IS 'ID do paciente associado ao token';
COMMENT ON COLUMN public.family_access_tokens.token IS 'Token único para acesso familiar';
COMMENT ON COLUMN public.family_access_tokens.username IS 'Nome de usuário gerado para acesso familiar';
COMMENT ON COLUMN public.family_access_tokens.password IS 'Senha gerada para acesso familiar';
COMMENT ON COLUMN public.family_access_tokens.role IS 'Papel do usuário familiar (editor ou viewer)';
COMMENT ON COLUMN public.family_access_tokens.permissions IS 'Permissões específicas em formato JSON';
COMMENT ON COLUMN public.family_access_tokens.is_active IS 'Indica se o token está ativo';
COMMENT ON COLUMN public.family_access_tokens.expires_at IS 'Data de expiração do token (opcional)';
COMMENT ON COLUMN public.family_access_tokens.created_by_name IS 'Nome de quem criou o token';
COMMENT ON COLUMN public.family_access_tokens.revoked_at IS 'Data de revogação do token';
COMMENT ON COLUMN public.family_access_tokens.revoked_reason IS 'Motivo da revogação do token';

-- Inserir dados de exemplo para teste (opcional)
-- INSERT INTO public.family_access_tokens (
--     patient_id, 
--     token, 
--     username, 
--     password, 
--     role, 
--     permissions,
--     created_by_name,
--     expires_at
-- ) VALUES (
--     'patient-id-example',
--     'FAM-TOKEN-' || gen_random_uuid()::text,
--     'familia_exemplo',
--     'senha123',
--     'viewer',
--     '{"canView": true, "canEdit": false, "canRegisterLiquids": false, "canRegisterMedications": false, "canRegisterMeals": false, "canRegisterActivities": false}'::jsonb,
--     'Sistema de Teste',
--     NOW() + INTERVAL '30 days'
-- );

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'family_access_tokens' 
    AND table_schema = 'public'
ORDER BY ordinal_position;