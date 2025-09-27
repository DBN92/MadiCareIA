# Guia de Segurança - API Key OpenAI

## Configuração Segura da API Key

### 1. Configuração Local (.env)

Para desenvolvimento local, configure sua API key no arquivo `.env`:

```bash
VITE_OPENAI_API_KEY=sk-sua-chave-aqui
```

**⚠️ IMPORTANTE:**
- Nunca commite o arquivo `.env` no repositório
- O arquivo `.env` já está incluído no `.gitignore`
- Use apenas chaves válidas que começam com `sk-`

### 2. Configuração em Produção

Para ambientes de produção, configure a variável de ambiente através do seu provedor de hospedagem:

#### Vercel
```bash
vercel env add VITE_OPENAI_API_KEY
```

#### Netlify
```bash
netlify env:set VITE_OPENAI_API_KEY sk-sua-chave-aqui
```

#### Docker
```bash
docker run -e VITE_OPENAI_API_KEY=sk-sua-chave-aqui sua-imagem
```

### 3. Configuração via Interface

O sistema permite configurar a API key através da interface de usuário:

1. Acesse **Configurações** → **Chat IA**
2. Insira sua API key no campo apropriado
3. A chave será armazenada localmente no navegador
4. O sistema validará automaticamente o formato da chave

### 4. Validação de Segurança

O sistema implementa as seguintes validações:

- ✅ Verifica se a chave começa com `sk-`
- ✅ Valida o comprimento mínimo da chave
- ✅ Rejeita chaves placeholder comuns
- ✅ Não usa variáveis de ambiente como fallback padrão
- ✅ Exibe mensagens de erro claras para chaves inválidas

### 5. Boas Práticas

#### Para Desenvolvedores
- Nunca hardcode API keys no código
- Use sempre o arquivo `.env` para desenvolvimento
- Teste com chaves válidas antes de fazer deploy
- Monitore o uso da API para detectar uso não autorizado

#### Para Administradores
- Rotacione as API keys regularmente
- Use chaves com permissões mínimas necessárias
- Monitore logs de erro para tentativas de uso inválido
- Configure alertas para uso excessivo da API

### 6. Troubleshooting

#### Erro: "API key não configurada ou inválida"
1. Verifique se a chave começa com `sk-`
2. Confirme que a chave tem pelo menos 20 caracteres
3. Teste a chave diretamente na API da OpenAI
4. Verifique se não há espaços extras na chave

#### Erro: "Serviço de chat não disponível"
1. Verifique sua conexão com a internet
2. Confirme se a API key tem créditos disponíveis
3. Verifique se a chave não foi revogada
4. Consulte o status da API OpenAI

### 7. Arquivos de Configuração

#### .env (desenvolvimento)
```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-sua-chave-aqui

# Outras configurações...
VITE_SUPABASE_URL=sua-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-supabase
```

#### .env.production (produção)
```bash
# Apenas variáveis necessárias para build
# API keys devem ser configuradas no ambiente de hospedagem
```

### 8. Monitoramento

O sistema registra automaticamente:
- Tentativas de uso com chaves inválidas
- Erros de autenticação da API
- Mudanças nas configurações de API key

Verifique os logs do sistema regularmente para identificar possíveis problemas de segurança.

---

**Lembre-se:** A segurança da API key é fundamental para proteger seu projeto e evitar custos desnecessários. Sempre siga as práticas recomendadas de segurança.