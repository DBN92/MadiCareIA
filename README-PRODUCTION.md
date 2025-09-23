# Deploy em Produção - MediCare

## Problema Identificado

O chat não funcionava em produção devido à falta de configuração adequada das variáveis de ambiente durante o processo de build do Docker.

## Soluções Implementadas

### 1. Dockerfile Atualizado
- Adicionados argumentos (ARG) para receber as variáveis de ambiente durante o build
- Configuradas as variáveis de ambiente (ENV) para que estejam disponíveis durante o build do Vite

### 2. Melhor Tratamento de Erros
- Adicionada verificação da API key da OpenAI no serviço
- Mensagens de erro mais específicas para problemas de autenticação
- Logs de debug para facilitar a identificação de problemas

### 3. Arquivos de Configuração
- `.env.production`: Arquivo com as variáveis de produção
- `docker-compose.yml`: Configuração para deploy com Docker Compose

## Como Fazer Deploy

### Opção 1: Docker Compose (Recomendado)
```bash
# 1. Configure as variáveis de ambiente
# Copie o arquivo .env.production e configure com suas chaves reais
cp .env.production .env
# Edite o arquivo .env e adicione sua API key da OpenAI na variável VITE_OPENAI_API_KEY

# 2. Execute o build e deploy
docker-compose up --build -d
```

### Opção 2: Docker Manual
```bash
# 1. Build da imagem com as variáveis de ambiente
docker build \
  --build-arg VITE_OPENAI_API_KEY="sua-api-key-real" \
  --build-arg VITE_SUPABASE_PROJECT_ID="seu-project-id" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="sua-publishable-key" \
  --build-arg VITE_SUPABASE_URL="sua-supabase-url" \
  -t medicare-app .

# 2. Execute o container
docker run -p 80:80 medicare-app
```

### Opção 3: Plataformas de Deploy (Vercel, Netlify, etc.)
Certifique-se de configurar as seguintes variáveis de ambiente na plataforma:
- `VITE_OPENAI_API_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

## Verificação

Após o deploy, verifique:
1. Abra o console do navegador na aplicação
2. Teste o chat - se houver problemas, você verá mensagens específicas no console
3. Verifique se não há warnings sobre "VITE_OPENAI_API_KEY não está configurada"

## Troubleshooting

### Chat não responde
- Verifique se a API key da OpenAI está configurada corretamente
- Verifique se a API key não expirou
- Verifique os logs do container: `docker logs <container-id>`

### Erro de autenticação
- Verifique se a API key está correta
- Verifique se há créditos disponíveis na conta OpenAI

### Variáveis de ambiente não carregam
- Certifique-se de que as variáveis estão sendo passadas durante o build
- Verifique se os nomes das variáveis estão corretos (devem começar com VITE_)