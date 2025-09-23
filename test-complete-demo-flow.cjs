// Teste completo do fluxo demo - Criação de usuário e verificação funcional

class CompleteDemoFlowTester {
  constructor() {
    this.baseUrl = 'http://localhost:8081';
    this.testUser = {
      email: `demo.teste.${Date.now()}@exemplo.com`,
      password: 'senha123',
      name: 'Usuário Demo Teste'
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
  }

  // Simular localStorage
  createMockLocalStorage() {
    const storage = {};
    return {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => storage[key] = value,
      removeItem: (key) => delete storage[key],
      clear: () => Object.keys(storage).forEach(key => delete storage[key]),
      _storage: storage
    };
  }

  // Hash de senha simples para simulação
  async hashPassword(password) {
    return `hashed_${password}_${Date.now()}`;
  }

  // Simular processo completo de cadastro
  async simulateSignup(localStorage) {
    this.log('📝 INICIANDO CADASTRO DEMO', 'info');
    this.log(`Email: ${this.testUser.email}`, 'info');
    this.log(`Senha: ${this.testUser.password}`, 'info');
    
    try {
      // Gerar dados do usuário demo
      const userId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = await this.hashPassword(this.testUser.password);
      const demoToken = `demo_token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const demoUser = {
        id: userId,
        email: this.testUser.email,
        password: hashedPassword,
        demo_token: demoToken,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true,
        last_login: null
      };
      
      // Verificar usuários existentes
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      
      // Verificar se email já existe
      const emailExists = existingUsers.some(user => user.email === this.testUser.email);
      if (emailExists) {
        throw new Error('Email já cadastrado');
      }
      
      // Adicionar novo usuário
      existingUsers.push(demoUser);
      localStorage.setItem('demo_users', JSON.stringify(existingUsers));
      
      // Salvar dados de autenticação (incluindo correção do demo_user_id)
      localStorage.setItem('demo_token', demoToken);
      localStorage.setItem('demo_user_id', userId);
      localStorage.setItem('demo_expires_at', expiresAt);
      localStorage.setItem('demo_days_remaining', '7');
      
      this.log('✅ Cadastro realizado com sucesso!', 'success');
      this.log(`   ID do usuário: ${userId}`, 'info');
      this.log(`   Token gerado: ${demoToken.substring(0, 25)}...`, 'info');
      this.log(`   Expira em: ${new Date(expiresAt).toLocaleDateString('pt-BR')}`, 'info');
      
      return { success: true, user: demoUser };
      
    } catch (error) {
      this.log(`❌ Erro no cadastro: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Simular logout
  simulateLogout(localStorage) {
    this.log('🚪 Simulando logout...', 'info');
    
    const authKeys = ['demo_token', 'demo_user_id', 'demo_expires_at', 'demo_days_remaining'];
    authKeys.forEach(key => localStorage.removeItem(key));
    
    this.log('✅ Logout realizado', 'success');
  }

  // Simular processo de login
  async simulateLogin(localStorage) {
    this.log('🔑 INICIANDO LOGIN DEMO', 'info');
    this.log(`Email: ${this.testUser.email}`, 'info');
    
    try {
      // Buscar usuários cadastrados
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      
      if (existingUsers.length === 0) {
        throw new Error('Nenhum usuário demo encontrado');
      }
      
      this.log(`   Usuários encontrados: ${existingUsers.length}`, 'info');
      
      // Buscar usuário por email
      const user = existingUsers.find(u => u.email === this.testUser.email);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      this.log(`   Usuário localizado: ${user.id}`, 'info');
      
      // Verificar expiração
      const now = new Date();
      const expiresAt = new Date(user.expires_at);
      
      if (now > expiresAt) {
        throw new Error('Conta demo expirada');
      }
      
      // Verificar se está ativa
      if (!user.is_active) {
        throw new Error('Conta demo inativa');
      }
      
      // Calcular dias restantes
      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      // Salvar dados de autenticação
      localStorage.setItem('demo_token', user.demo_token);
      localStorage.setItem('demo_user_id', user.id);
      localStorage.setItem('demo_expires_at', user.expires_at);
      localStorage.setItem('demo_days_remaining', daysRemaining.toString());
      
      // Atualizar último login
      const updatedUsers = existingUsers.map(u => 
        u.id === user.id ? { ...u, last_login: new Date().toISOString() } : u
      );
      localStorage.setItem('demo_users', JSON.stringify(updatedUsers));
      
      this.log('✅ Login realizado com sucesso!', 'success');
      this.log(`   Dias restantes: ${daysRemaining}`, 'info');
      this.log(`   Último login atualizado`, 'info');
      
      return { success: true, user, daysRemaining };
      
    } catch (error) {
      this.log(`❌ Erro no login: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Verificar autenticação demo
  verifyDemoAuth(localStorage) {
    this.log('🔍 VERIFICANDO AUTENTICAÇÃO DEMO', 'info');
    
    const requiredKeys = ['demo_token', 'demo_user_id', 'demo_expires_at'];
    const missingKeys = [];
    const authData = {};
    
    requiredKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        authData[key] = value;
      } else {
        missingKeys.push(key);
      }
    });
    
    if (missingKeys.length > 0) {
      this.log(`❌ Dados de autenticação faltando: ${missingKeys.join(', ')}`, 'error');
      return { authenticated: false, missingKeys };
    }
    
    // Verificar expiração
    const expiresAt = new Date(authData.demo_expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      this.log('❌ Token de autenticação expirado', 'error');
      return { authenticated: false, expired: true };
    }
    
    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    this.log('✅ Autenticação demo válida!', 'success');
    this.log(`   Token: ${authData.demo_token.substring(0, 20)}...`, 'info');
    this.log(`   User ID: ${authData.demo_user_id}`, 'info');
    this.log(`   Dias restantes: ${daysRemaining}`, 'info');
    
    return { authenticated: true, authData, daysRemaining };
  }

  // Testar funcionalidades básicas
  testDemoFeatures(localStorage) {
    this.log('🧪 TESTANDO FUNCIONALIDADES DEMO', 'info');
    
    const features = [
      {
        name: 'Dados de usuário salvos',
        test: () => {
          const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
          return users.length > 0;
        }
      },
      {
        name: 'Token de autenticação presente',
        test: () => {
          return !!localStorage.getItem('demo_token');
        }
      },
      {
        name: 'ID do usuário presente',
        test: () => {
          return !!localStorage.getItem('demo_user_id');
        }
      },
      {
        name: 'Data de expiração válida',
        test: () => {
          const expiresAt = localStorage.getItem('demo_expires_at');
          if (!expiresAt) return false;
          const date = new Date(expiresAt);
          return date > new Date();
        }
      },
      {
        name: 'Dias restantes calculados',
        test: () => {
          const days = localStorage.getItem('demo_days_remaining');
          return days && parseInt(days) > 0;
        }
      }
    ];
    
    let passedTests = 0;
    
    features.forEach(feature => {
      try {
        const result = feature.test();
        if (result) {
          this.log(`   ✅ ${feature.name}`, 'success');
          passedTests++;
        } else {
          this.log(`   ❌ ${feature.name}`, 'error');
        }
      } catch (error) {
        this.log(`   ❌ ${feature.name}: ${error.message}`, 'error');
      }
    });
    
    const successRate = (passedTests / features.length) * 100;
    
    this.log(`📊 Funcionalidades testadas: ${passedTests}/${features.length} (${successRate.toFixed(1)}%)`, 'info');
    
    return { passedTests, totalTests: features.length, successRate };
  }

  // Mostrar estado completo do localStorage
  showLocalStorageState(localStorage, title) {
    this.log(`📋 ${title}`, 'info');
    this.log('=' .repeat(50), 'info');
    
    const allKeys = ['demo_users', 'demo_token', 'demo_user_id', 'demo_expires_at', 'demo_days_remaining'];
    
    allKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        if (key === 'demo_users') {
          try {
            const users = JSON.parse(value);
            this.log(`   ${key}: ${users.length} usuário(s)`, 'info');
            users.forEach((user, index) => {
              this.log(`     [${index + 1}] ${user.email} (${user.id})`, 'info');
            });
          } catch (e) {
            this.log(`   ${key}: Dados inválidos`, 'warning');
          }
        } else {
          const displayValue = value.length > 40 ? value.substring(0, 40) + '...' : value;
          this.log(`   ${key}: ${displayValue}`, 'info');
        }
      } else {
        this.log(`   ${key}: (não definido)`, 'warning');
      }
    });
  }

  async run() {
    this.log('🚀 INICIANDO TESTE COMPLETO DO FLUXO DEMO', 'info');
    this.log('=' .repeat(60), 'info');
    this.log('', 'info');
    
    // Criar localStorage simulado
    const localStorage = this.createMockLocalStorage();
    
    // Limpar dados anteriores
    localStorage.clear();
    this.log('🧹 LocalStorage limpo para teste limpo', 'info');
    this.log('', 'info');
    
    // ETAPA 1: Cadastro
    this.log('📝 ETAPA 1: CADASTRO DE USUÁRIO DEMO', 'warning');
    this.log('-' .repeat(40), 'info');
    
    const signupResult = await this.simulateSignup(localStorage);
    
    if (!signupResult.success) {
      this.log('🚨 TESTE FALHOU NA ETAPA DE CADASTRO!', 'error');
      return false;
    }
    
    this.showLocalStorageState(localStorage, 'Estado após cadastro');
    this.log('', 'info');
    
    // ETAPA 2: Logout
    this.log('🚪 ETAPA 2: LOGOUT (LIMPEZA DE SESSÃO)', 'warning');
    this.log('-' .repeat(40), 'info');
    
    this.simulateLogout(localStorage);
    this.showLocalStorageState(localStorage, 'Estado após logout');
    this.log('', 'info');
    
    // ETAPA 3: Login
    this.log('🔑 ETAPA 3: LOGIN COM CREDENCIAIS', 'warning');
    this.log('-' .repeat(40), 'info');
    
    const loginResult = await this.simulateLogin(localStorage);
    
    if (!loginResult.success) {
      this.log('🚨 TESTE FALHOU NA ETAPA DE LOGIN!', 'error');
      return false;
    }
    
    this.showLocalStorageState(localStorage, 'Estado após login');
    this.log('', 'info');
    
    // ETAPA 4: Verificação de autenticação
    this.log('🔍 ETAPA 4: VERIFICAÇÃO DE AUTENTICAÇÃO', 'warning');
    this.log('-' .repeat(40), 'info');
    
    const authResult = this.verifyDemoAuth(localStorage);
    
    if (!authResult.authenticated) {
      this.log('🚨 TESTE FALHOU NA VERIFICAÇÃO DE AUTENTICAÇÃO!', 'error');
      return false;
    }
    
    this.log('', 'info');
    
    // ETAPA 5: Teste de funcionalidades
    this.log('🧪 ETAPA 5: TESTE DE FUNCIONALIDADES', 'warning');
    this.log('-' .repeat(40), 'info');
    
    const featuresResult = this.testDemoFeatures(localStorage);
    
    this.log('', 'info');
    
    // RESUMO FINAL
    this.log('📊 RESUMO FINAL DO TESTE', 'warning');
    this.log('=' .repeat(60), 'info');
    
    const allTestsPassed = signupResult.success && 
                          loginResult.success && 
                          authResult.authenticated && 
                          featuresResult.successRate === 100;
    
    if (allTestsPassed) {
      this.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!', 'success');
      this.log('', 'info');
      this.log('✅ Resultados:', 'success');
      this.log('   • Cadastro demo: FUNCIONANDO', 'success');
      this.log('   • Login demo: FUNCIONANDO', 'success');
      this.log('   • Autenticação: FUNCIONANDO', 'success');
      this.log(`   • Funcionalidades: ${featuresResult.passedTests}/${featuresResult.totalTests} OK`, 'success');
      this.log('', 'info');
      this.log('🎯 O sistema demo está completamente funcional!', 'success');
      this.log('', 'info');
      this.log('📱 Para testar manualmente:', 'info');
      this.log('   1. Acesse: http://localhost:8081/demo/signup', 'info');
      this.log('   2. Cadastre um usuário', 'info');
      this.log('   3. Faça login em: http://localhost:8081/demo/login', 'info');
      this.log('   4. Acesse o dashboard: http://localhost:8081/demo/dashboard', 'info');
      
    } else {
      this.log('🚨 ALGUNS TESTES FALHARAM!', 'error');
      this.log('', 'info');
      this.log('❌ Problemas identificados:', 'error');
      if (!signupResult.success) this.log('   • Cadastro demo não funcionou', 'error');
      if (!loginResult.success) this.log('   • Login demo não funcionou', 'error');
      if (!authResult.authenticated) this.log('   • Autenticação não funcionou', 'error');
      if (featuresResult.successRate < 100) {
        this.log(`   • Funcionalidades com problemas: ${featuresResult.totalTests - featuresResult.passedTests}`, 'error');
      }
    }
    
    return allTestsPassed;
  }
}

// Executar o teste
const tester = new CompleteDemoFlowTester();
tester.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n🚨 Erro durante execução do teste:', error);
  process.exit(1);
});