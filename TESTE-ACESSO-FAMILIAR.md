# Guia de Teste - Sistema de Acesso Familiar

## Problema Relatado
O login e senha do acesso familiar não estão funcionando.

## Passos para Testar e Resolver

### 1. Verificar se há pacientes cadastrados
1. Acesse: http://localhost:8080/patients
2. Verifique se há pacientes na lista
3. Se não houver, clique em "Adicionar Paciente" e cadastre um paciente de teste

### 2. Gerar credenciais de acesso familiar
1. Na página de pacientes, clique no botão "Compartilhar" de um paciente
2. Isso deve abrir um modal com as credenciais (usuário e senha)
3. Anote as credenciais geradas

### 3. Testar o login familiar
1. Acesse: http://localhost:8080/family/login
2. Digite as credenciais geradas no passo anterior
3. Clique em "Entrar"

### 4. Usar a ferramenta de debug
1. Abra o arquivo: debug-family-access.html
2. Clique em "Verificar LocalStorage" para ver se há tokens
3. Se não houver tokens, clique em "Gerar Credenciais" para criar um token de teste
4. Use as credenciais geradas para testar o login

## Possíveis Causas do Problema

### A. Não há pacientes cadastrados
- **Solução**: Cadastrar pelo menos um paciente

### B. Não foram geradas credenciais
- **Solução**: Usar o botão "Compartilhar" na página de pacientes

### C. Credenciais foram revogadas
- **Solução**: Gerar novas credenciais

### D. Problema no localStorage
- **Solução**: Limpar o localStorage e gerar novas credenciais

### E. Erro na função de autenticação
- **Solução**: Verificar o console do navegador para erros

## Como Limpar e Reiniciar

```javascript
// Execute no console do navegador para limpar todos os dados
localStorage.removeItem('bedside_family_tokens');
localStorage.clear();
location.reload();
```

## URLs Importantes

- **Aplicação Principal**: http://localhost:8080
- **Página de Pacientes**: http://localhost:8080/patients
- **Login Familiar**: http://localhost:8080/family/login
- **Debug Tool**: debug-family-access.html

## Estrutura do Token

Cada token de acesso familiar tem a seguinte estrutura:

```json
{
  "id": "uuid",
  "patient_id": "id-do-paciente",
  "token": "token-unico",
  "username": "familia_XXXXXX_XXXX",
  "password": "senha-gerada",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## Fluxo Esperado

1. **Cadastro de Paciente** → Paciente é salvo no Supabase
2. **Compartilhar Paciente** → Gera token e credenciais no localStorage
3. **Login Familiar** → Valida credenciais contra tokens no localStorage
4. **Acesso ao Dashboard** → Redireciona para `/family/{patient_id}/{token}/dashboard`

## Verificações de Segurança

- Tokens são únicos por paciente
- Credenciais são geradas automaticamente
- Tokens são revogados quando paciente recebe alta
- Acesso é validado a cada requisição