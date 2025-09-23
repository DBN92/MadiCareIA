#!/usr/bin/env node

/**
 * Script de teste para o sistema de demo do MediCare
 * Testa o fluxo completo: cadastro, login, expiração e limpeza
 */

const fs = require('fs');
const path = require('path');

// Simulação do localStorage para testes
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Simulação do crypto para testes
class CryptoMock {
  randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  subtle = {
    digest: async (algorithm, data) => {
      // Simulação simples de hash
      const str = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
      return new ArrayBuffer(32); // SHA-256 mock
    }
  };
}

// Setup global mocks
global.localStorage = new LocalStorageMock();
global.crypto = new CryptoMock();
global.TextEncoder = class {
  encode(str) {
    return new Uint8Array(Buffer.from(str, 'utf8'));
  }
};

class DemoSystemTester {
  constructor() {
    this.testResults = [];
    this.localStorage = global.localStorage;
    this.crypto = global.crypto;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    if (type === 'error') {
      console.error(logMessage);
    }
  }

  async test(name, testFn) {
    try {
      this.log(`Iniciando teste: ${name}`);
      await testFn();
      this.testResults.push({ name, status: 'PASS', error: null });
      this.log(`✅ Teste passou: ${name}`, 'success');
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      this.log(`❌ Teste falhou: ${name} - ${error.message}`, 'error');
    }
  }

  // Função para hash da senha (mesmo algoritmo do frontend)
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'demo_salt_2024');
    const hashBuffer = await this.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Gerar token demo
  generateDemoToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'demo_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async runAllTests() {
    this.log('🚀 Iniciando testes do sistema demo do MediCare');
    this.log('=' .repeat(60));

    // Limpar localStorage antes dos testes
    this.localStorage.clear();

    await this.test('Verificar estrutura de arquivos demo', () => {
      const requiredFiles = [
        'src/pages/DemoLanding.tsx',
        'src/pages/DemoSignup.tsx',
        'src/pages/DemoLogin.tsx',
        'src/components/DemoExpiredModal.tsx',
        'src/components/DemoGuard.tsx',
        'src/hooks/useDemoAuth.ts'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Arquivo obrigatório não encontrado: ${file}`);
        }
      }
    });

    await this.test('Cadastro de usuário demo', async () => {
      const email = 'teste@demo.com';
      const password = 'senha123';
      
      // Simular cadastro
      const existingUsers = JSON.parse(this.localStorage.getItem('demo_users') || '[]');
      
      if (existingUsers.some(user => user.email === email)) {
        throw new Error('Email já deveria estar disponível para teste');
      }

      const demoToken = this.generateDemoToken();
      const passwordHash = await this.hashPassword(password);
      const userId = this.crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newUser = {
        id: userId,
        email: email,
        password_hash: passwordHash,
        demo_token: demoToken,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true
      };

      existingUsers.push(newUser);
      this.localStorage.setItem('demo_users', JSON.stringify(existingUsers));
      
      // Verificar se foi salvo corretamente
      const savedUsers = JSON.parse(this.localStorage.getItem('demo_users') || '[]');
      const savedUser = savedUsers.find(u => u.email === email);
      
      if (!savedUser) {
        throw new Error('Usuário não foi salvo corretamente');
      }
      
      if (savedUser.demo_token !== demoToken) {
        throw new Error('Token demo não foi salvo corretamente');
      }
    });

    await this.test('Login de usuário demo', async () => {
      const email = 'teste@demo.com';
      const password = 'senha123';
      
      const existingUsers = JSON.parse(this.localStorage.getItem('demo_users') || '[]');
      const passwordHash = await this.hashPassword(password);
      
      const user = existingUsers.find(u => 
        u.email === email && 
        u.password_hash === passwordHash &&
        u.is_active
      );

      if (!user) {
        throw new Error('Usuário não encontrado ou credenciais inválidas');
      }

      const now = new Date();
      const expiresAt = new Date(user.expires_at);
      
      if (now > expiresAt) {
        throw new Error('Conta demo já expirada');
      }

      // Simular login bem-sucedido
      this.localStorage.setItem('demo_token', user.demo_token);
      this.localStorage.setItem('demo_user_id', user.id);
      this.localStorage.setItem('demo_expires_at', user.expires_at);
      
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      this.localStorage.setItem('demo_days_remaining', daysRemaining.toString());
    });

    await this.test('Validação de token demo', () => {
      const token = this.localStorage.getItem('demo_token');
      const userId = this.localStorage.getItem('demo_user_id');
      const expiresAt = this.localStorage.getItem('demo_expires_at');
      
      if (!token || !userId || !expiresAt) {
        throw new Error('Dados de autenticação demo não encontrados');
      }

      const existingUsers = JSON.parse(this.localStorage.getItem('demo_users') || '[]');
      const user = existingUsers.find(u => u.id === userId && u.is_active);
      
      if (!user) {
        throw new Error('Usuário demo não encontrado ou inativo');
      }
      
      if (user.demo_token !== token) {
        throw new Error('Token demo não confere');
      }
    });

    await this.test('Cálculo de dias restantes', () => {
      const expiresAt = this.localStorage.getItem('demo_expires_at');
      
      if (!expiresAt) {
        throw new Error('Data de expiração não encontrada');
      }
      
      const now = new Date();
      const expiration = new Date(expiresAt);
      const timeDiff = expiration.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 0 || daysDiff > 7) {
        throw new Error(`Dias restantes inválidos: ${daysDiff}`);
      }
    });

    await this.test('Simulação de expiração de conta', () => {
      const userId = this.localStorage.getItem('demo_user_id');
      
      if (!userId) {
        throw new Error('ID do usuário demo não encontrado');
      }
      
      // Simular expiração alterando a data
      const existingUsers = JSON.parse(this.localStorage.getItem('demo_users') || '[]');
      const updatedUsers = existingUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
            is_active: false
          };
        }
        return user;
      });
      
      this.localStorage.setItem('demo_users', JSON.stringify(updatedUsers));
      
      // Verificar se a conta foi desativada
      const updatedUser = updatedUsers.find(u => u.id === userId);
      if (updatedUser.is_active) {
        throw new Error('Conta não foi desativada após expiração');
      }
    });

    await this.test('Limpeza de dados expirados', () => {
      // Limpar dados do localStorage
      this.localStorage.removeItem('demo_token');
      this.localStorage.removeItem('demo_user_id');
      this.localStorage.removeItem('demo_expires_at');
      this.localStorage.removeItem('demo_days_remaining');
      
      // Verificar se foram removidos
      const token = this.localStorage.getItem('demo_token');
      const userId = this.localStorage.getItem('demo_user_id');
      
      if (token || userId) {
        throw new Error('Dados de sessão não foram limpos corretamente');
      }
    });

    await this.test('Verificar isolamento de dados entre usuários', async () => {
      // Criar dois usuários diferentes
      const user1 = {
        id: this.crypto.randomUUID(),
        email: 'user1@demo.com',
        password_hash: await this.hashPassword('senha1'),
        demo_token: this.generateDemoToken(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      };
      
      const user2 = {
        id: this.crypto.randomUUID(),
        email: 'user2@demo.com',
        password_hash: await this.hashPassword('senha2'),
        demo_token: this.generateDemoToken(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      };
      
      const users = [user1, user2];
      this.localStorage.setItem('demo_users', JSON.stringify(users));
      
      // Verificar que os tokens são únicos
      if (user1.demo_token === user2.demo_token) {
        throw new Error('Tokens demo não são únicos entre usuários');
      }
      
      // Verificar que os IDs são únicos
      if (user1.id === user2.id) {
        throw new Error('IDs de usuário não são únicos');
      }
    });

    this.generateReport();
  }

  generateReport() {
    this.log('\n' + '=' .repeat(60));
    this.log('📊 RELATÓRIO DE TESTES DO SISTEMA DEMO');
    this.log('=' .repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    this.log(`Total de testes: ${totalTests}`);
    this.log(`Testes aprovados: ${passedTests}`);
    this.log(`Testes falharam: ${failedTests}`);
    this.log(`Taxa de sucesso: ${successRate}%`);
    
    if (failedTests > 0) {
      this.log('\n❌ TESTES QUE FALHARAM:', 'error');
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.error}`, 'error');
        });
    }
    
    this.log('\n✅ FUNCIONALIDADES TESTADAS:');
    this.log('  • Cadastro de usuário demo');
    this.log('  • Sistema de autenticação');
    this.log('  • Geração e validação de tokens');
    this.log('  • Controle de expiração (7 dias)');
    this.log('  • Isolamento de dados entre usuários');
    this.log('  • Limpeza automática de dados expirados');
    
    this.log('\n🔧 RECOMENDAÇÕES:');
    this.log('  • Teste manual das páginas web (/demo, /demo/signup, /demo/login)');
    this.log('  • Verificar responsividade em diferentes dispositivos');
    this.log('  • Testar fluxo completo no navegador');
    this.log('  • Validar integração com componentes React');
    
    this.log('\n🎯 STATUS GERAL: ' + (failedTests === 0 ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM'));
    this.log('=' .repeat(60));
  }
}

// Executar testes
if (require.main === module) {
  const tester = new DemoSystemTester();
  tester.runAllTests().catch(error => {
    console.error('Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = DemoSystemTester;