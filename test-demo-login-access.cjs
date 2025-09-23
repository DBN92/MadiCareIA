const http = require('http');

class DemoLoginTester {
  constructor() {
    this.baseUrl = 'http://localhost:8081';
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

  async testUrl(path) {
    return new Promise((resolve) => {
      const url = `${this.baseUrl}${path}`;
      
      const req = http.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            success: res.statusCode === 200
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({
          status: 0,
          error: error.message,
          success: false
        });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          status: 0,
          error: 'Timeout',
          success: false
        });
      });
    });
  }

  async testDemoRoutes() {
    this.log('🔍 TESTANDO ACESSO ÀS ROTAS DEMO', 'info');
    this.log('=' .repeat(50), 'info');
    
    const routes = [
      { path: '/demo', name: 'Demo Landing' },
      { path: '/demo/signup', name: 'Demo Signup' },
      { path: '/demo/login', name: 'Demo Login' },
      { path: '/demo/dashboard', name: 'Demo Dashboard' }
    ];
    
    const results = [];
    
    for (const route of routes) {
      this.log(`Testando ${route.name} (${route.path})...`, 'info');
      
      const result = await this.testUrl(route.path);
      
      if (result.success) {
        this.log(`✅ ${route.name}: OK (${result.status})`, 'success');
        
        // Verificar se é uma página React válida
        if (result.body.includes('<!doctype html') || result.body.includes('<div id="root">')) {
          this.log(`   📄 Página HTML válida detectada`, 'info');
        } else {
          this.log(`   ⚠️  Resposta não parece ser uma página HTML`, 'warning');
        }
      } else {
        this.log(`❌ ${route.name}: FALHOU (${result.status || 'ERROR'})`, 'error');
        if (result.error) {
          this.log(`   Erro: ${result.error}`, 'error');
        }
      }
      
      results.push({
        ...route,
        ...result
      });
      
      // Pequena pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  async checkServerStatus() {
    this.log('🔍 VERIFICANDO STATUS DO SERVIDOR', 'info');
    
    const result = await this.testUrl('/');
    
    if (result.success) {
      this.log('✅ Servidor está respondendo', 'success');
      return true;
    } else {
      this.log('❌ Servidor não está respondendo', 'error');
      if (result.error) {
        this.log(`   Erro: ${result.error}`, 'error');
      }
      return false;
    }
  }

  async run() {
    this.log('🚀 INICIANDO TESTE DE ACESSO DEMO LOGIN', 'info');
    this.log('', 'info');
    
    // Verificar se o servidor está rodando
    const serverOk = await this.checkServerStatus();
    
    if (!serverOk) {
      this.log('', 'info');
      this.log('🚨 SERVIDOR NÃO ESTÁ RESPONDENDO!', 'error');
      this.log('Certifique-se de que o servidor está rodando em http://localhost:8081', 'error');
      return false;
    }
    
    this.log('', 'info');
    
    // Testar rotas demo
    const results = await this.testDemoRoutes();
    
    this.log('', 'info');
    this.log('📊 RESUMO DOS TESTES', 'info');
    this.log('=' .repeat(50), 'info');
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      this.log(`${icon} ${result.name} (${result.path})`, 'info');
      if (!result.success && result.error) {
        this.log(`   Erro: ${result.error}`, 'info');
      }
    });
    
    const successRate = (successCount / totalCount) * 100;
    this.log(``, 'info');
    this.log(`📈 Taxa de sucesso: ${successCount}/${totalCount} (${successRate.toFixed(1)}%)`, 'info');
    
    if (successRate === 100) {
      this.log('🎉 TODAS AS ROTAS DEMO ESTÃO ACESSÍVEIS!', 'success');
      this.log('', 'info');
      this.log('✨ Próximos passos:', 'info');
      this.log('• Acesse http://localhost:8081/demo/login no navegador', 'info');
      this.log('• Verifique se a página carrega corretamente', 'info');
      this.log('• Teste o formulário de login', 'info');
    } else {
      this.log('🚨 ALGUMAS ROTAS NÃO ESTÃO ACESSÍVEIS!', 'error');
      this.log('', 'info');
      this.log('🔧 Possíveis soluções:', 'info');
      this.log('• Verificar se o servidor Vite está rodando', 'info');
      this.log('• Verificar configuração das rotas no App.tsx', 'info');
      this.log('• Verificar logs do terminal para erros', 'info');
    }
    
    return successRate >= 75;
  }
}

// Executar o teste
const tester = new DemoLoginTester();
tester.run().catch(console.error);