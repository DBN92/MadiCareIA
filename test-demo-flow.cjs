#!/usr/bin/env node

/**
 * Teste simples do fluxo demo sem dependências externas
 * Verifica se as rotas demo estão acessíveis
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class SimpleDemoTester {
  constructor() {
    this.baseUrl = 'http://localhost:8081';
    this.results = [];
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

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async testRoute(path, description) {
    try {
      this.log(`Testando: ${description}`, 'test');
      
      const response = await this.makeRequest(path);
      
      if (response.statusCode === 200) {
        const hasHtml = response.body.includes('<!DOCTYPE html>') || response.body.includes('<html');
        
        if (hasHtml) {
          this.log(`✓ ${description} - OK (${response.statusCode})`, 'success');
          return { success: true, statusCode: response.statusCode };
        } else {
          this.log(`✗ ${description} - Resposta não é HTML válido`, 'error');
          return { success: false, statusCode: response.statusCode, error: 'Not HTML' };
        }
      } else {
        this.log(`✗ ${description} - Status ${response.statusCode}`, 'error');
        return { success: false, statusCode: response.statusCode };
      }
    } catch (error) {
      this.log(`✗ ${description} - Erro: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testServerConnection() {
    try {
      this.log('Verificando conexão com o servidor...', 'test');
      const response = await this.makeRequest('/');
      
      if (response.statusCode >= 200 && response.statusCode < 400) {
        this.log('✓ Servidor está respondendo', 'success');
        return true;
      } else {
        this.log(`✗ Servidor retornou status ${response.statusCode}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`✗ Não foi possível conectar ao servidor: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 INICIANDO TESTE SIMPLES DO FLUXO DEMO', 'info');
    this.log('=' .repeat(50), 'info');
    
    // Primeiro verificar se o servidor está rodando
    const serverOk = await this.testServerConnection();
    if (!serverOk) {
      this.log('🚨 SERVIDOR NÃO ESTÁ ACESSÍVEL!', 'error');
      this.log('Verifique se o comando "npm run dev" está rodando', 'info');
      return false;
    }
    
    const tests = [
      { path: '/demo', name: 'Página inicial do demo' },
      { path: '/demo/signup', name: 'Página de cadastro demo' },
      { path: '/demo/login', name: 'Página de login demo' },
      { path: '/demo/dashboard', name: 'Dashboard demo' }
    ];
    
    let passedTests = 0;
    
    for (const { path, name } of tests) {
      const result = await this.testRoute(path, name);
      
      if (result.success) {
        passedTests++;
        this.results.push({ name, status: 'PASSOU', path });
      } else {
        this.results.push({ 
          name, 
          status: 'FALHOU', 
          path, 
          error: result.error || `Status ${result.statusCode}` 
        });
      }
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Relatório final
    this.log('\n' + '=' .repeat(50), 'info');
    this.log('📊 RELATÓRIO FINAL', 'info');
    this.log('=' .repeat(50), 'info');
    
    this.results.forEach(result => {
      const icon = result.status === 'PASSOU' ? '✅' : '❌';
      this.log(`${icon} ${result.name} (${result.path})`, 'info');
      if (result.error) {
        this.log(`   Erro: ${result.error}`, 'info');
      }
    });
    
    const successRate = (passedTests / tests.length) * 100;
    this.log(`\n📈 Taxa de sucesso: ${passedTests}/${tests.length} (${successRate.toFixed(1)}%)`, 'info');
    
    if (successRate === 100) {
      this.log('🎉 TODAS AS ROTAS DEMO ESTÃO FUNCIONANDO!', 'success');
    } else if (successRate >= 75) {
      this.log('⚠️  Maioria das rotas demo funcionando', 'info');
    } else {
      this.log('🚨 PROBLEMAS CRÍTICOS NAS ROTAS DEMO!', 'error');
    }
    
    this.log('\n🔍 PRÓXIMOS PASSOS:', 'info');
    if (successRate === 100) {
      this.log('• Testar manualmente o cadastro demo em http://localhost:8081/demo/signup', 'info');
      this.log('• Testar o login demo em http://localhost:8081/demo/login', 'info');
      this.log('• Verificar se o dashboard demo carrega após login', 'info');
    } else {
      this.log('• Verificar configuração das rotas no App.tsx', 'info');
      this.log('• Confirmar se todos os componentes demo existem', 'info');
      this.log('• Verificar logs do servidor para erros', 'info');
    }
    
    return successRate >= 75;
  }
}

// Executar testes
if (require.main === module) {
  const tester = new SimpleDemoTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal no teste:', error);
      process.exit(1);
    });
}

module.exports = SimpleDemoTester;