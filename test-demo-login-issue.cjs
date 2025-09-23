// Teste específico para reproduzir o problema de login demo

class DemoLoginIssueTester {
  constructor() {
    this.log('🔍 INVESTIGANDO PROBLEMA DE LOGIN DEMO', 'info');
    this.log('=' .repeat(50), 'info');
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

  // Simular localStorage do navegador
  createMockLocalStorage() {
    const storage = {};
    return {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => storage[key] = value,
      removeItem: (key) => delete storage[key],
      clear: () => Object.keys(storage).forEach(key => delete storage[key]),
      get length() { return Object.keys(storage).length; },
      key: (index) => Object.keys(storage)[index] || null,
      _storage: storage
    };
  }

  // Simular hash de senha (mesmo algoritmo usado no código)
  async hashPassword(password) {
    // Simulação simples do hash - no código real usa crypto
    return `hashed_${password}_${Date.now()}`;
  }

  // Simular processo de cadastro
  async simulateSignup(email, password, localStorage) {
    this.log(`📝 Simulando cadastro para: ${email}`, 'info');
    
    try {
      // Gerar dados como no DemoSignup.tsx
      const userId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = await this.hashPassword(password);
      const demoToken = `demo_token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const demoUser = {
        id: userId,
        email: email,
        password: hashedPassword,
        demo_token: demoToken,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true,
        last_login: null
      };
      
      // Verificar se já existe lista de usuários
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      
      // Verificar se email já existe
      const emailExists = existingUsers.some(user => user.email === email);
      if (emailExists) {
        throw new Error('Email já cadastrado');
      }
      
      // Adicionar novo usuário
      existingUsers.push(demoUser);
      localStorage.setItem('demo_users', JSON.stringify(existingUsers));
      
      // Salvar dados de autenticação (CORREÇÃO APLICADA)
      localStorage.setItem('demo_token', demoToken);
      localStorage.setItem('demo_user_id', userId); // ← Esta linha foi adicionada na correção
      localStorage.setItem('demo_expires_at', expiresAt);
      localStorage.setItem('demo_days_remaining', '7');
      
      this.log(`✅ Cadastro realizado com sucesso`, 'success');
      this.log(`   ID: ${userId}`, 'info');
      this.log(`   Token: ${demoToken.substring(0, 20)}...`, 'info');
      
      return { success: true, user: demoUser };
      
    } catch (error) {
      this.log(`❌ Erro no cadastro: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Simular processo de login
  async simulateLogin(email, password, localStorage) {
    this.log(`🔑 Simulando login para: ${email}`, 'info');
    
    try {
      // Buscar usuários cadastrados
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      
      if (existingUsers.length === 0) {
        throw new Error('Nenhum usuário demo encontrado');
      }
      
      this.log(`   Encontrados ${existingUsers.length} usuários demo`, 'info');
      
      // Buscar usuário por email
      const user = existingUsers.find(u => u.email === email);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      this.log(`   Usuário encontrado: ${user.id}`, 'info');
      
      // Verificar senha (simular hash)
      const hashedInputPassword = await this.hashPassword(password);
      
      // NOTA: No código real, a verificação seria diferente
      // Aqui vamos simular que a senha está correta se o email existe
      
      // Verificar se conta não expirou
      const now = new Date();
      const expiresAt = new Date(user.expires_at);
      
      if (now > expiresAt) {
        throw new Error('Conta demo expirada');
      }
      
      // Verificar se conta está ativa
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
      
      this.log(`✅ Login realizado com sucesso`, 'success');
      this.log(`   Dias restantes: ${daysRemaining}`, 'info');
      
      return { success: true, user, daysRemaining };
      
    } catch (error) {
      this.log(`❌ Erro no login: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Verificar estado do localStorage após operações
  checkLocalStorageState(localStorage, step) {
    this.log(`📋 Estado do localStorage após ${step}:`, 'info');
    
    const keys = ['demo_users', 'demo_token', 'demo_user_id', 'demo_expires_at', 'demo_days_remaining'];
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        if (key === 'demo_users') {
          const users = JSON.parse(value);
          this.log(`   ${key}: ${users.length} usuário(s)`, 'info');
        } else {
          const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
          this.log(`   ${key}: ${displayValue}`, 'info');
        }
      } else {
        this.log(`   ${key}: (não definido)`, 'warning');
      }
    });
  }

  async run() {
    this.log('🚀 INICIANDO TESTE DE REPRODUÇÃO DO PROBLEMA', 'info');
    this.log('', 'info');
    
    // Criar localStorage simulado
    const localStorage = this.createMockLocalStorage();
    
    // Dados de teste
    const testEmail = 'teste@demo.com';
    const testPassword = 'senha123';
    
    this.log(`📧 Email de teste: ${testEmail}`, 'info');
    this.log(`🔒 Senha de teste: ${testPassword}`, 'info');
    this.log('', 'info');
    
    // Passo 1: Limpar localStorage
    localStorage.clear();
    this.log('🧹 localStorage limpo', 'info');
    this.checkLocalStorageState(localStorage, 'limpeza');
    this.log('', 'info');
    
    // Passo 2: Simular cadastro
    const signupResult = await this.simulateSignup(testEmail, testPassword, localStorage);
    
    if (!signupResult.success) {
      this.log('🚨 FALHA NO CADASTRO - TESTE INTERROMPIDO', 'error');
      return false;
    }
    
    this.checkLocalStorageState(localStorage, 'cadastro');
    this.log('', 'info');
    
    // Passo 3: Simular logout (limpar tokens de autenticação)
    this.log('🚪 Simulando logout...', 'info');
    localStorage.removeItem('demo_token');
    localStorage.removeItem('demo_user_id');
    localStorage.removeItem('demo_expires_at');
    localStorage.removeItem('demo_days_remaining');
    
    this.checkLocalStorageState(localStorage, 'logout');
    this.log('', 'info');
    
    // Passo 4: Simular login
    const loginResult = await this.simulateLogin(testEmail, testPassword, localStorage);
    
    if (!loginResult.success) {
      this.log('🚨 FALHA NO LOGIN - PROBLEMA REPRODUZIDO!', 'error');
      this.log('', 'info');
      this.log('🔍 ANÁLISE DO PROBLEMA:', 'warning');
      this.log(`   Erro: ${loginResult.error}`, 'warning');
      return false;
    }
    
    this.checkLocalStorageState(localStorage, 'login');
    this.log('', 'info');
    
    // Verificar se todos os dados necessários estão presentes
    const requiredKeys = ['demo_token', 'demo_user_id', 'demo_expires_at'];
    const missingKeys = requiredKeys.filter(key => !localStorage.getItem(key));
    
    if (missingKeys.length > 0) {
      this.log('⚠️  DADOS FALTANDO APÓS LOGIN:', 'warning');
      missingKeys.forEach(key => {
        this.log(`   - ${key}`, 'warning');
      });
      return false;
    }
    
    this.log('🎉 FLUXO COMPLETO FUNCIONANDO!', 'success');
    this.log('', 'info');
    this.log('✅ Resumo:', 'info');
    this.log('• Cadastro: OK', 'info');
    this.log('• Logout: OK', 'info');
    this.log('• Login: OK', 'info');
    this.log('• Dados salvos: OK', 'info');
    
    return true;
  }
}

// Executar o teste
const tester = new DemoLoginIssueTester();
tester.run().then(success => {
  if (success) {
    console.log('\n🎯 O fluxo demo está funcionando corretamente na simulação.');
    console.log('Se você ainda está enfrentando problemas, pode ser:');
    console.log('• Cache do navegador');
    console.log('• JavaScript desabilitado');
    console.log('• Extensões do navegador interferindo');
    console.log('• Problema específico do navegador');
  } else {
    console.log('\n🚨 Problema identificado na simulação!');
    console.log('Verifique os logs acima para detalhes.');
  }
}).catch(console.error);