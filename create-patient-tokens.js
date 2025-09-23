// Script para criar tokens de acesso familiar para um paciente específico
// Execute este código no console do navegador (F12 -> Console)

const FAMILY_TOKENS_KEY = 'bedside_family_tokens';
const PATIENT_ID = 'a215e412-25a9-4b89-b4a1-8dc4b11a7b01';

function createPatientTokens(patientId) {
    console.log(`🚀 Criando tokens para paciente: ${patientId}`);
    
    const tokens = [
        {
            id: 'token-editor-' + Date.now(),
            patient_id: patientId,
            token: 'family-token-editor-' + patientId.substring(0, 8),
            username: 'familia_editor',
            password: 'senha123',
            role: 'editor',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            id: 'token-viewer-' + Date.now(),
            patient_id: patientId,
            token: 'family-token-viewer-' + patientId.substring(0, 8),
            username: 'familia_viewer',
            password: 'senha123',
            role: 'viewer',
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];
    
    try {
        // Obter tokens existentes
        const existing = localStorage.getItem(FAMILY_TOKENS_KEY);
        const existingTokens = existing ? JSON.parse(existing) : [];
        
        // Remover tokens antigos para este paciente
        const filteredTokens = existingTokens.filter(t => 
            t.patient_id !== patientId
        );
        
        // Adicionar novos tokens
        const allTokens = [...filteredTokens, ...tokens];
        
        localStorage.setItem(FAMILY_TOKENS_KEY, JSON.stringify(allTokens));
        
        console.log('✅ Tokens criados com sucesso!');
        console.log(`📦 Total de tokens salvos: ${allTokens.length}`);
        
        tokens.forEach(token => {
            console.log(`Criado: ${token.role} - ${token.token}`);
            const url = `http://localhost:8080/family/${patientId}/${token.token}`;
            console.log(`URL ${token.role}: ${url}`);
        });
        
        // URLs específicas para testar
        console.log('\n🔗 URLs para testar:');
        console.log(`Editor: http://localhost:8080/family/${patientId}/${tokens[0].token}`);
        console.log(`Viewer: http://localhost:8080/family/${patientId}/${tokens[1].token}`);
        console.log(`Care (Editor): http://localhost:8080/family/${patientId}/${tokens[0].token}?view=care`);
        console.log(`Care (Viewer): http://localhost:8080/family/${patientId}/${tokens[1].token}?view=care`);
        
        return tokens;
        
    } catch (error) {
        console.error(`❌ Erro ao criar tokens: ${error.message}`);
        return null;
    }
}

// Executar automaticamente
const createdTokens = createPatientTokens(PATIENT_ID);

if (createdTokens) {
    console.log('\n🎉 Tokens criados! Agora você pode acessar:');
    console.log(`- Dashboard Editor: http://localhost:8080/family/${PATIENT_ID}/${createdTokens[0].token}`);
    console.log(`- Care Editor: http://localhost:8080/family/${PATIENT_ID}/${createdTokens[0].token}?view=care`);
    console.log(`- Dashboard Viewer: http://localhost:8080/family/${PATIENT_ID}/${createdTokens[1].token}`);
    console.log(`- Care Viewer: http://localhost:8080/family/${PATIENT_ID}/${createdTokens[1].token}?view=care`);
}