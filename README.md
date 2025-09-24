# MediCare - Sistema de Gestão Hospitalar

Sistema completo de gestão hospitalar desenvolvido com React, TypeScript e Supabase.

## Funcionalidades

- **Dashboard Administrativo**: Visão geral completa do sistema
- **Gestão de Pacientes**: Cadastro, edição e acompanhamento de pacientes
- **Gestão de Usuários**: Controle de acesso e permissões
- **Gestão de Hospitais**: Cadastro e gerenciamento de unidades hospitalares
- **Sistema de Cuidados**: Registro e acompanhamento de cuidados médicos
- **Relatórios**: Geração de relatórios detalhados
- **Acesso Familiar**: Portal para familiares acompanharem pacientes
- **Chat IA**: Assistente virtual integrado
- **Sistema de Logs**: Auditoria completa das ações do sistema

## Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **UI Components**: Radix UI, Lucide Icons
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (Supabase)

## Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Configuração Local

1. Clone o repositório:
```bash
git clone <repository-url>
cd MediCare
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Configure suas credenciais do Supabase no arquivo `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:8080`

## Scripts Disponíveis

- `npm run dev` - Executa o projeto em modo de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── contexts/           # Contextos React
├── integrations/       # Integrações (Supabase)
├── lib/               # Utilitários
└── styles/            # Estilos globais
```

## Deploy

### Build de Produção

```bash
npm run build
```

### Deploy com Docker

```bash
docker build -t medicare .
docker run -p 80:80 medicare
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para suporte, entre em contato através do email: suporte@medicare.com
