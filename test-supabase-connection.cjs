// Teste de conectividade com Supabase
const https = require('https');
const http = require('http');
const { URL } = require('url');

class SupabaseConnectionTester {
  constructor() {
    this.supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
    this.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';
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

  // Teste básico de conectividade HTTP
  async testBasicConnectivity() {
    this.log('🌐 TESTE 1: Conectividade básica com Supabase', 'info');
    
    return new Promise((resolve) => {
      const url = new URL(this.supabaseUrl);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: '/',
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'SupabaseConnectionTester/1.0'
        }
      };

      const req = https.request(options, (res) => {
        this.log(`   Status: ${res.statusCode}`, res.statusCode === 200 ? 'success' : 'warning');
        this.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`, 'info');
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            this.log('✅ Conectividade básica: OK', 'success');
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            this.log(`❌ Conectividade básica: Falhou (${res.statusCode})`, 'error');
            resolve({ success: false, statusCode: res.statusCode });
          }
        });
      });

      req.on('error', (error) => {
        this.log(`❌ Erro de conectividade: ${error.message}`, 'error');
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        this.log('❌ Timeout na conexão', 'error');
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      req.end();
    });
  }

  // Teste da API REST do Supabase
  async testRestAPI() {
    this.log('🔌 TESTE 2: API REST do Supabase', 'info');
    
    return new Promise((resolve) => {
      const url = new URL(`${this.supabaseUrl}/rest/v1/`);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'GET',
        timeout: 10000,
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SupabaseConnectionTester/1.0'
        }
      };

      const req = https.request(options, (res) => {
        this.log(`   Status da API: ${res.statusCode}`, res.statusCode === 200 ? 'success' : 'warning');
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            this.log('✅ API REST: Acessível', 'success');
            try {
              const parsed = JSON.parse(data);
              this.log(`   Resposta: ${JSON.stringify(parsed, null, 2)}`, 'info');
            } catch (e) {
              this.log(`   Resposta (texto): ${data.substring(0, 200)}...`, 'info');
            }
            resolve({ success: true, statusCode: res.statusCode, data });
          } else {
            this.log(`❌ API REST: Falhou (${res.statusCode})`, 'error');
            this.log(`   Resposta: ${data}`, 'error');
            resolve({ success: false, statusCode: res.statusCode, data });
          }
        });
      });

      req.on('error', (error) => {
        this.log(`❌ Erro na API REST: ${error.message}`, 'error');
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        this.log('❌ Timeout na API REST', 'error');
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      req.end();
    });
  }

  // Teste específico da tabela events
  async testEventsTable() {
    this.log('📊 TESTE 3: Acesso à tabela events', 'info');
    
    return new Promise((resolve) => {
      const url = new URL(`${this.supabaseUrl}/rest/v1/events`);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}?select=*&limit=1`,
        method: 'GET',
        timeout: 15000,
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SupabaseConnectionTester/1.0'
        }
      };

      const req = https.request(options, (res) => {
        this.log(`   Status da tabela events: ${res.statusCode}`, res.statusCode === 200 ? 'success' : 'warning');
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            this.log('✅ Tabela events: Acessível', 'success');
            try {
              const parsed = JSON.parse(data);
              this.log(`   Registros encontrados: ${parsed.length}`, 'info');
              if (parsed.length > 0) {
                this.log(`   Primeiro registro: ${JSON.stringify(parsed[0], null, 2)}`, 'info');
              }
            } catch (e) {
              this.log(`   Resposta (texto): ${data.substring(0, 200)}...`, 'info');
            }
            resolve({ success: true, statusCode: res.statusCode, data });
          } else {
            this.log(`❌ Tabela events: Falhou (${res.statusCode})`, 'error');
            this.log(`   Resposta: ${data}`, 'error');
            resolve({ success: false, statusCode: res.statusCode, data });
          }
        });
      });

      req.on('error', (error) => {
        this.log(`❌ Erro na tabela events: ${error.message}`, 'error');
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        this.log('❌ Timeout na tabela events', 'error');
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      req.end();
    });
  }

  // Teste da query específica que está falhando
  async testSpecificQuery() {
    this.log('🎯 TESTE 4: Query específica que está falhando', 'info');
    
    return new Promise((resolve) => {
      const queryPath = '/rest/v1/events?select=*%2Cpatients%28full_name%2Cbed%29&order=occurred_at.desc';
      const url = new URL(`${this.supabaseUrl}${queryPath}`);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: queryPath,
        method: 'GET',
        timeout: 15000,
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SupabaseConnectionTester/1.0'
        }
      };

      this.log(`   URL completa: ${this.supabaseUrl}${queryPath}`, 'info');

      const req = https.request(options, (res) => {
        this.log(`   Status da query específica: ${res.statusCode}`, res.statusCode === 200 ? 'success' : 'warning');
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            this.log('✅ Query específica: Funcionando', 'success');
            try {
              const parsed = JSON.parse(data);
              this.log(`   Registros retornados: ${parsed.length}`, 'info');
              if (parsed.length > 0) {
                this.log(`   Exemplo de registro: ${JSON.stringify(parsed[0], null, 2)}`, 'info');
              }
            } catch (e) {
              this.log(`   Resposta (texto): ${data.substring(0, 300)}...`, 'info');
            }
            resolve({ success: true, statusCode: res.statusCode, data });
          } else {
            this.log(`❌ Query específica: Falhou (${res.statusCode})`, 'error');
            this.log(`   Resposta: ${data}`, 'error');
            resolve({ success: false, statusCode: res.statusCode, data });
          }
        });
      });

      req.on('error', (error) => {
        this.log(`❌ Erro na query específica: ${error.message}`, 'error');
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        this.log('❌ Timeout na query específica', 'error');
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      req.end();
    });
  }

  // Teste de DNS
  async testDNS() {
    this.log('🌍 TESTE 5: Resolução DNS', 'info');
    
    const dns = require('dns');
    
    return new Promise((resolve) => {
      dns.lookup('envqimsupjgovuofbghj.supabase.co', (err, address, family) => {
        if (err) {
          this.log(`❌ Erro de DNS: ${err.message}`, 'error');
          resolve({ success: false, error: err.message });
        } else {
          this.log(`✅ DNS resolvido: ${address} (IPv${family})`, 'success');
          resolve({ success: true, address, family });
        }
      });
    });
  }

  // Executar todos os testes
  async runAllTests() {
    this.log('🚀 INICIANDO DIAGNÓSTICO DE CONECTIVIDADE SUPABASE', 'info');
    this.log('=' .repeat(60), 'info');
    this.log('', 'info');
    
    const results = {};
    
    // Teste 1: DNS
    results.dns = await this.testDNS();
    this.log('', 'info');
    
    // Teste 2: Conectividade básica
    results.basic = await this.testBasicConnectivity();
    this.log('', 'info');
    
    // Teste 3: API REST
    results.api = await this.testRestAPI();
    this.log('', 'info');
    
    // Teste 4: Tabela events
    results.events = await this.testEventsTable();
    this.log('', 'info');
    
    // Teste 5: Query específica
    results.specificQuery = await this.testSpecificQuery();
    this.log('', 'info');
    
    // Resumo final
    this.log('📊 RESUMO DOS TESTES', 'warning');
    this.log('=' .repeat(60), 'info');
    
    const testNames = {
      dns: 'Resolução DNS',
      basic: 'Conectividade Básica',
      api: 'API REST',
      events: 'Tabela Events',
      specificQuery: 'Query Específica'
    };
    
    let passedTests = 0;
    let totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([key, result]) => {
      const status = result.success ? '✅' : '❌';
      const name = testNames[key];
      this.log(`   ${status} ${name}`, result.success ? 'success' : 'error');
      if (result.success) passedTests++;
      if (!result.success && result.error) {
        this.log(`      Erro: ${result.error}`, 'error');
      }
    });
    
    this.log('', 'info');
    const successRate = (passedTests / totalTests) * 100;
    this.log(`📈 Taxa de sucesso: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`, 'info');
    
    if (successRate === 100) {
      this.log('🎉 Todos os testes passaram! A conectividade está OK.', 'success');
      this.log('', 'info');
      this.log('💡 Se ainda há erros no navegador, pode ser:', 'warning');
      this.log('   • Problema de CORS', 'info');
      this.log('   • Cache do navegador', 'info');
      this.log('   • Extensões do navegador', 'info');
      this.log('   • Configuração de proxy/firewall', 'info');
    } else {
      this.log('🚨 Alguns testes falharam. Verifique:', 'error');
      this.log('   • Conexão com a internet', 'info');
      this.log('   • Configurações de firewall', 'info');
      this.log('   • Status do Supabase: https://status.supabase.com', 'info');
      this.log('   • Configurações de proxy', 'info');
    }
    
    return results;
  }
}

// Executar os testes
const tester = new SupabaseConnectionTester();
tester.runAllTests().then(results => {
  const allPassed = Object.values(results).every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}).catch(error => {
  console.error('\n🚨 Erro durante execução dos testes:', error);
  process.exit(1);
});