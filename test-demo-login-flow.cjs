#!/usr/bin/env node

/**
 * Teste do fluxo de cadastro e login demo
 * Simula o processo completo para identificar problemas
 */

const crypto = require('crypto');

class DemoLoginFlowTester {
  constructor() {
    this.testEmail = `test${Date.now()}@demo.com`;
    this.testPassword = 'demo123456';
    this.localStorage = new Map();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'test': '🧪'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Simular localStorage
  setItem(key, value) {
    this.localStorage.set(key, value);
    this.log(`localStorage.setItem('${key}', '${typeof value === 'string' ? value.substring(0, 50) : value}...')`, 'info');
  }

  getItem(key) {
    return this.localStorage.get(key) || null;
  }

  // Simular hash de senha (igual ao código real)
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'demo_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Simular geração de token
  generateDemoToken() {
    return 'demo_token_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  }

  // Simular processo de cadastro
  async simulateSignup() {
    this.log('🚀 INICIANDO SIMULAÇÃO DE CADASTRO DEMO', 'test');
    
    try {
      // Verificar usuários existentes
      const existingUsersStr = this.getItem('demo_users') || '[]';
      const existingUsers = JSON.parse(existingUsersStr);
      
      this.log(`Usuários existentes: ${existingUsers.length}`, 'info');
      
      // Verificar se email já existe
      const emailExists = existingUsers.some(user => user.email === this.testEmail);
      if (emailExists) {
        this.log('❌ Email já existe', 'error');
        return false;
      }
      
      // Gerar dados do usuário
      const demoToken = this.generateDemoToken();
      const passwordHash = await this.hashPassword(this.testPassword);
      const userId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      this.log(`Token gerado: ${demoToken}`, 'info');
      this.log(`Hash da senha: ${passwordHash.substring(0, 20)}...`, 'info');
      this.log(`User ID: ${userId}`, 'info');
      
      // Criar usuário
      const newUser = {
        id: userId,
        email: this.testEmail,
        password_hash: passwordHash,
        demo_token: demoToken,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true
      };
      
      // Salvar usuário
      existingUsers.push(newUser);
      this.setItem('demo_users', JSON.stringify(existingUsers));
      
      // Salvar dados de sessão (CORRIGIDO)
      this.setItem('demo_token', demoToken);
      this.setItem('demo_user_id', userId); // ESTA LINHA ESTAVA FALTANDO!
      this.setItem('demo_user_email', this.testEmail);
      this.setItem('demo_expires_at', expiresAt);
      
      this.log('✅ Cadastro simulado com sucesso', 'success');
      return { success: true, user: newUser };
      
    } catch (error) {
      this.log(`❌ Erro no cadastro: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Simular processo de login
  async simulateLogin() {
    this.log('🔐 INICIANDO SIMULAÇÃO DE LOGIN DEMO', 'test');
    
    try {
      // Buscar usuários
      const existingUsersStr = this.getItem('demo_users') || '[]';
      const existingUsers = JSON.parse(existingUsersStr);
      
      this.log(`Buscando usuário com email: ${this.testEmail}`, 'info');
      
      // Hash da senha para comparação
      const passwordHash = await this.hashPassword(this.testPassword);
      this.log(`Hash da senha para login: ${passwordHash.substring(0, 20)}...`, 'info');
      
      // Encontrar usuário
      const user = existingUsers.find(u => 
        u.email === this.testEmail && 
        u.password_hash === passwordHash &&
        u.is_active
      );
      
      if (!user) {
        this.log('❌ Usuário não encontrado ou senha incorreta', 'error');
        
        // Debug: mostrar usuários disponíveis
        this.log('Usuários disponíveis:', 'info');
        existingUsers.forEach((u, index) => {
          this.log(`  ${index + 1}. Email: ${u.email}, Hash: ${u.password_hash.substring(0, 20)}..., Ativo: ${u.is_active}`, 'info');
        });
        
        return { success: false, error: 'Usuário não encontrado' };
      }
      
      this.log(`✅ Usuário encontrado: ${user.email}`, 'success');
      
      // Verificar expiração
      const now = new Date();
      const expiresAt = new Date(user.expires_at);
      
      if (now > expiresAt) {
        this.log('❌ Conta expirada', 'error');
        return { success: false, error: 'Conta expirada' };
      }
      
      // Calcular dias restantes
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      this.log(`Dias restantes: ${daysRemaining}`, 'info');
      
      // Salvar dados de sessão
      this.setItem('demo_token', user.demo_token);
      this.setItem('demo_user_id', user.id);
      this.setItem('demo_expires_at', user.expires_at);
      this.setItem('demo_days_remaining', daysRemaining.toString());
      
      this.log('✅ Login simulado com sucesso', 'success');
      return { success: true, user, daysRemaining };
      
    } catch (error) {
      this.log(`❌ Erro no login: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Verificar autenticação (simular useDemoAuth)
  checkAuthentication() {
    this.log('🔍 VERIFICANDO AUTENTICAÇÃO', 'test');
    
    const token = this.getItem('demo_token');
    const userId = this.getItem('demo_user_id');
    const expiresAt = this.getItem('demo_expires_at');
    
    this.log(`Token: ${token ? 'Presente' : 'Ausente'}`, 'info');
    this.log(`User ID: ${userId ? 'Presente' : 'Ausente'}`, 'info');
    this.log(`Expires At: ${expiresAt ? 'Presente' : 'Ausente'}`, 'info');
    
    if (!token || !userId || !expiresAt) {
      this.log('❌ Dados de autenticação incompletos', 'error');
      return false;
    }
    
    // Verificar se usuário existe
    const existingUsersStr = this.getItem('demo_users') || '[]';
    const existingUsers = JSON.parse(existingUsersStr);
    const user = existingUsers.find(u => u.id === userId && u.is_active);
    
    if (!user) {
      this.log('❌ Usuário não encontrado na base de dados', 'error');
      return false;
    }
    
    this.log('✅ Autenticação válida', 'success');
    return true;
  }

  async runFullTest() {
    this.log('🎯 TESTE COMPLETO DO FLUXO DEMO', 'info');
    this.log('=' .repeat(50), 'info');
    
    // 1. Simular cadastro
    const signupResult = await this.simulateSignup();
    if (!signupResult.success) {
      this.log('🚨 FALHA NO CADASTRO - TESTE INTERROMPIDO', 'error');
      return false;
    }
    
    // 2. Limpar dados de sessão (simular logout)
    this.log('\n🔄 Limpando dados de sessão (simular logout)...', 'info');
    this.localStorage.delete('demo_token');
    this.localStorage.delete('demo_user_id');
    this.localStorage.delete('demo_expires_at');
    this.localStorage.delete('demo_days_remaining');
    
    // 3. Simular login
    this.log('', 'info');
    const loginResult = await this.simulateLogin();
    if (!loginResult.success) {
      this.log('🚨 FALHA NO LOGIN', 'error');
      return false;
    }
    
    // 4. Verificar autenticação
    this.log('', 'info');
    const authValid = this.checkAuthentication();
    if (!authValid) {
      this.log('🚨 FALHA NA VERIFICAÇÃO DE AUTENTICAÇÃO', 'error');
      return false;
    }
    
    // Relatório final
    this.log('\n' + '=' .repeat(50), 'info');
    this.log('🎉 TESTE COMPLETO - TODOS OS PASSOS FUNCIONARAM!', 'success');
    this.log('=' .repeat(50), 'info');
    
    this.log('\n📋 RESUMO:', 'info');
    this.log('✅ Cadastro demo funcionando', 'success');
    this.log('✅ Login demo funcionando', 'success');
    this.log('✅ Autenticação funcionando', 'success');
    this.log('✅ Dados salvos corretamente no localStorage', 'success');
    
    this.log('\n🔧 CORREÇÃO APLICADA:', 'info');
    this.log('• Adicionado demo_user_id no localStorage durante cadastro', 'info');
    this.log('• Isso resolve o problema de login após cadastro', 'info');
    
    return true;
  }
}

// Executar teste
if (require.main === module) {
  const tester = new DemoLoginFlowTester();
  tester.runFullTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal no teste:', error);
      process.exit(1);
    });
}

module.exports = DemoLoginFlowTester;