-- Tabela para armazenar histórico de versões das configurações
CREATE TABLE IF NOT EXISTS public.settings_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_id VARCHAR(50) NOT NULL UNIQUE, -- Identificador único da versão (ex: v1.0.0, v1.0.1)
    version_name VARCHAR(100), -- Nome descritivo da versão (opcional)
    settings_type VARCHAR(50) NOT NULL, -- Tipo de configuração (chat, system, theme, etc.)
    settings_data JSONB NOT NULL, -- Dados das configurações em formato JSON
    description TEXT, -- Descrição das mudanças
    created_by UUID REFERENCES auth.users(id), -- Usuário que criou a versão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE, -- Indica se é a versão ativa atual
    tags TEXT[], -- Tags para categorização (ex: ['stable', 'beta', 'hotfix'])
    
    -- Índices para melhor performance
    CONSTRAINT unique_active_per_type UNIQUE (settings_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_settings_history_type ON public.settings_history(settings_type);
CREATE INDEX IF NOT EXISTS idx_settings_history_created_at ON public.settings_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_history_version_id ON public.settings_history(version_id);
CREATE INDEX IF NOT EXISTS idx_settings_history_active ON public.settings_history(settings_type, is_active) WHERE is_active = true;

-- Função para garantir que apenas uma versão por tipo seja ativa
CREATE OR REPLACE FUNCTION ensure_single_active_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a nova versão está sendo marcada como ativa
    IF NEW.is_active = true THEN
        -- Desativar todas as outras versões do mesmo tipo
        UPDATE public.settings_history 
        SET is_active = false 
        WHERE settings_type = NEW.settings_type 
        AND id != NEW.id 
        AND is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para garantir versão ativa única
DROP TRIGGER IF EXISTS trigger_ensure_single_active_version ON public.settings_history;
CREATE TRIGGER trigger_ensure_single_active_version
    BEFORE INSERT OR UPDATE ON public.settings_history
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_version();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.settings_history ENABLE ROW LEVEL SECURITY;

-- Política para leitura: usuários autenticados podem ver histórico
CREATE POLICY "Users can view settings history" ON public.settings_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserção: apenas usuários autenticados podem criar versões
CREATE POLICY "Authenticated users can create settings versions" ON public.settings_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização: apenas o criador ou admin pode atualizar
CREATE POLICY "Users can update their own settings versions" ON public.settings_history
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Política para exclusão: apenas admin pode excluir
CREATE POLICY "Only admins can delete settings versions" ON public.settings_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Comentários para documentação
COMMENT ON TABLE public.settings_history IS 'Armazena histórico de versões das configurações do sistema';
COMMENT ON COLUMN public.settings_history.version_id IS 'Identificador único da versão (ex: v1.0.0, v1.0.1)';
COMMENT ON COLUMN public.settings_history.settings_type IS 'Tipo de configuração (chat, system, theme, etc.)';
COMMENT ON COLUMN public.settings_history.settings_data IS 'Dados das configurações em formato JSON';
COMMENT ON COLUMN public.settings_history.is_active IS 'Indica se é a versão ativa atual';
COMMENT ON COLUMN public.settings_history.tags IS 'Tags para categorização (ex: stable, beta, hotfix)';