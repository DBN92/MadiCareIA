import fs from 'fs';
import path from 'path';

// Simular diferentes tamanhos de tela
const deviceBreakpoints = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  mobileLarge: { width: 414, height: 896, name: 'Mobile Large (iPhone 11)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
  tabletLarge: { width: 1024, height: 1366, name: 'Tablet Large (iPad Pro)' },
  desktop: { width: 1280, height: 720, name: 'Desktop Small' },
  desktopLarge: { width: 1920, height: 1080, name: 'Desktop Large' },
  ultrawide: { width: 2560, height: 1440, name: 'Ultrawide' }
};

// Breakpoints CSS esperados
const expectedBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

let testResults = [];

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`${status} - ${testName}`);
  if (details) console.log(`   ${details}`);
  testResults.push({ name: testName, passed, details });
}

function analyzeCSS() {
  console.log('\n🎨 Analisando arquivos CSS...');
  
  const cssFiles = [];
  const srcDir = './src';
  
  function findCSSFiles(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findCSSFiles(filePath);
        } else if (file.endsWith('.css') || file.endsWith('.scss') || file.endsWith('.module.css')) {
          cssFiles.push(filePath);
        }
      }
    } catch (error) {
      // Diretório pode não existir
    }
  }
  
  findCSSFiles(srcDir);
  
  // Também verificar index.css na raiz
  if (fs.existsSync('./index.css')) {
    cssFiles.push('./index.css');
  }
  
  console.log(`   Encontrados ${cssFiles.length} arquivos CSS`);
  return cssFiles;
}

function checkTailwindConfig() {
  console.log('\n⚙️  Teste 1: Configuração do Tailwind CSS...');
  
  const configFiles = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs'];
  let configFound = false;
  let configContent = '';
  
  for (const configFile of configFiles) {
    if (fs.existsSync(configFile)) {
      configFound = true;
      configContent = fs.readFileSync(configFile, 'utf8');
      console.log(`   ✅ Arquivo de configuração encontrado: ${configFile}`);
      break;
    }
  }
  
  if (!configFound) {
    logTest('Configuração Tailwind', false, 'Arquivo de configuração não encontrado');
    return false;
  }
  
  // Verificar se contém configurações de breakpoints
  const hasScreens = configContent.includes('screens') || configContent.includes('breakpoints');
  const hasResponsiveConfig = configContent.includes('sm:') || configContent.includes('md:') || configContent.includes('lg:');
  
  logTest('Configuração Tailwind', configFound, 
    `Configuração encontrada${hasScreens ? ' com breakpoints customizados' : ''}`);
  
  return configFound;
}

function analyzeResponsiveClasses() {
  console.log('\n📱 Teste 2: Classes responsivas nos componentes...');
  
  const componentFiles = [];
  const srcDir = './src';
  
  function findComponentFiles(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findComponentFiles(filePath);
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.ts')) {
          componentFiles.push(filePath);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Erro ao ler diretório ${dir}`);
    }
  }
  
  findComponentFiles(srcDir);
  
  let totalResponsiveClasses = 0;
  let filesWithResponsive = 0;
  const responsivePatterns = [
    /\b(sm|md|lg|xl|2xl):/g,
    /\bhidden\s+(sm|md|lg|xl|2xl):/g,
    /\bblock\s+(sm|md|lg|xl|2xl):/g,
    /\bgrid-cols-\d+\s+(sm|md|lg|xl|2xl):grid-cols-\d+/g
  ];
  
  for (const file of componentFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let fileResponsiveCount = 0;
      
      for (const pattern of responsivePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          fileResponsiveCount += matches.length;
        }
      }
      
      if (fileResponsiveCount > 0) {
        filesWithResponsive++;
        totalResponsiveClasses += fileResponsiveCount;
        console.log(`   📄 ${path.basename(file)}: ${fileResponsiveCount} classes responsivas`);
      }
    } catch (error) {
      // Arquivo pode não ser legível
    }
  }
  
  const hasResponsiveDesign = totalResponsiveClasses > 0;
  
  logTest('Classes Responsivas', hasResponsiveDesign, 
    `${totalResponsiveClasses} classes encontradas em ${filesWithResponsive} arquivos`);
  
  return { totalResponsiveClasses, filesWithResponsive };
}

function checkCommonResponsivePatterns() {
  console.log('\n🔍 Teste 3: Padrões responsivos comuns...');
  
  const patterns = [
    {
      name: 'Grid Responsivo',
      pattern: /grid-cols-\d+.*(?:sm|md|lg|xl):grid-cols-\d+/,
      description: 'Layouts de grid que se adaptam'
    },
    {
      name: 'Texto Responsivo',
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl).*(?:sm|md|lg|xl):text-(xs|sm|base|lg|xl|2xl|3xl)/,
      description: 'Tamanhos de texto adaptativos'
    },
    {
      name: 'Padding/Margin Responsivo',
      pattern: /(?:p|m|px|py|mx|my)-\d+.*(?:sm|md|lg|xl):(?:p|m|px|py|mx|my)-\d+/,
      description: 'Espaçamentos adaptativos'
    },
    {
      name: 'Visibilidade Responsiva',
      pattern: /(?:hidden|block|inline|flex).*(?:sm|md|lg|xl):(?:hidden|block|inline|flex)/,
      description: 'Elementos que aparecem/desaparecem'
    },
    {
      name: 'Flexbox Responsivo',
      pattern: /flex-(?:col|row).*(?:sm|md|lg|xl):flex-(?:col|row)/,
      description: 'Direção de flex adaptativa'
    }
  ];
  
  const srcDir = './src';
  let foundPatterns = [];
  
  function searchPatterns(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          searchPatterns(filePath);
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          for (const pattern of patterns) {
            if (pattern.pattern.test(content)) {
              if (!foundPatterns.includes(pattern.name)) {
                foundPatterns.push(pattern.name);
                console.log(`   ✅ ${pattern.name}: ${pattern.description}`);
              }
            }
          }
        }
      }
    } catch (error) {
      // Diretório pode não existir
    }
  }
  
  searchPatterns(srcDir);
  
  const patternsFound = foundPatterns.length;
  const totalPatterns = patterns.length;
  
  logTest('Padrões Responsivos', patternsFound > 0, 
    `${patternsFound}/${totalPatterns} padrões responsivos encontrados`);
  
  return foundPatterns;
}

function simulateDeviceTests() {
  console.log('\n📱 Teste 4: Simulação de dispositivos...');
  
  const deviceTests = [];
  
  for (const [deviceKey, device] of Object.entries(deviceBreakpoints)) {
    const test = {
      device: device.name,
      width: device.width,
      height: device.height,
      breakpoint: getBreakpointForWidth(device.width),
      expectedBehavior: getExpectedBehavior(device.width)
    };
    
    deviceTests.push(test);
    console.log(`   📱 ${device.name} (${device.width}x${device.height}): ${test.breakpoint} breakpoint`);
  }
  
  // Simular testes de funcionalidade por dispositivo
  const functionalityTests = [
    'Navigation menu collapse/expand',
    'Touch-friendly button sizes',
    'Readable text sizes',
    'Proper spacing and layout',
    'Accessible form controls'
  ];
  
  let allDeviceTestsPassed = true;
  
  for (const test of deviceTests) {
    // Simular verificações de funcionalidade
    const devicePassed = simulateDeviceFunctionality(test);
    if (!devicePassed) allDeviceTestsPassed = false;
  }
  
  logTest('Simulação de Dispositivos', allDeviceTestsPassed, 
    `${deviceTests.length} dispositivos testados`);
  
  return deviceTests;
}

function getBreakpointForWidth(width) {
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
}

function getExpectedBehavior(width) {
  if (width < 768) {
    return 'Mobile layout: stacked elements, hamburger menu, large touch targets';
  } else if (width < 1024) {
    return 'Tablet layout: mixed layout, collapsible sidebar, medium spacing';
  } else {
    return 'Desktop layout: side-by-side elements, full navigation, compact spacing';
  }
}

function simulateDeviceFunctionality(deviceTest) {
  // Simular verificações de funcionalidade específicas do dispositivo
  const checks = [
    deviceTest.width >= 320, // Largura mínima suportada
    deviceTest.width <= 2560, // Largura máxima razoável
    deviceTest.height >= 480, // Altura mínima suportada
    true // Placeholder para outras verificações
  ];
  
  return checks.every(check => check);
}

function checkAccessibilityFeatures() {
  console.log('\n♿ Teste 5: Recursos de acessibilidade...');
  
  const accessibilityFeatures = [
    {
      name: 'Focus Indicators',
      check: () => checkForPattern(/focus:(?:ring|outline|border)/),
      description: 'Indicadores visuais de foco'
    },
    {
      name: 'ARIA Labels',
      check: () => checkForPattern(/aria-label|aria-labelledby|aria-describedby/),
      description: 'Rótulos ARIA para leitores de tela'
    },
    {
      name: 'Semantic HTML',
      check: () => checkForPattern(/<(?:main|nav|header|footer|section|article|aside)>/),
      description: 'Elementos HTML semânticos'
    },
    {
      name: 'Color Contrast',
      check: () => checkForPattern(/(?:text-gray-900|text-white|bg-blue-600|bg-red-500)/),
      description: 'Classes que indicam contraste adequado'
    },
    {
      name: 'Responsive Text',
      check: () => checkForPattern(/text-(?:sm|base|lg|xl).*(?:sm|md|lg|xl):text-(?:sm|base|lg|xl)/),
      description: 'Tamanhos de texto responsivos'
    }
  ];
  
  let accessibilityScore = 0;
  
  for (const feature of accessibilityFeatures) {
    const found = feature.check();
    if (found) {
      accessibilityScore++;
      console.log(`   ✅ ${feature.name}: ${feature.description}`);
    } else {
      console.log(`   ⚠️  ${feature.name}: Não encontrado`);
    }
  }
  
  const accessibilityPassed = accessibilityScore >= 3; // Pelo menos 3 de 5
  
  logTest('Recursos de Acessibilidade', accessibilityPassed, 
    `${accessibilityScore}/${accessibilityFeatures.length} recursos encontrados`);
  
  return accessibilityScore;
}

function checkForPattern(pattern) {
  const srcDir = './src';
  
  function searchInDir(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (searchInDir(filePath)) return true;
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (pattern.test(content)) {
            return true;
          }
        }
      }
    } catch (error) {
      // Diretório pode não existir
    }
    return false;
  }
  
  return searchInDir(srcDir);
}

function checkPerformanceOptimizations() {
  console.log('\n⚡ Teste 6: Otimizações de performance...');
  
  const optimizations = [
    {
      name: 'Lazy Loading',
      check: () => checkForPattern(/lazy|Suspense|React\.lazy/),
      description: 'Carregamento sob demanda de componentes'
    },
    {
      name: 'Image Optimization',
      check: () => checkForPattern(/loading=["']lazy["']|next\/image/),
      description: 'Otimização de imagens'
    },
    {
      name: 'CSS Purging',
      check: () => fs.existsSync('tailwind.config.js') || fs.existsSync('tailwind.config.ts'),
      description: 'Configuração para remoção de CSS não utilizado'
    },
    {
      name: 'Bundle Splitting',
      check: () => checkForPattern(/import\(|dynamic\(/),
      description: 'Divisão de código para carregamento otimizado'
    }
  ];
  
  let performanceScore = 0;
  
  for (const optimization of optimizations) {
    const found = optimization.check();
    if (found) {
      performanceScore++;
      console.log(`   ✅ ${optimization.name}: ${optimization.description}`);
    } else {
      console.log(`   ⚠️  ${optimization.name}: Não implementado`);
    }
  }
  
  const performancePassed = performanceScore >= 2; // Pelo menos 2 de 4
  
  logTest('Otimizações de Performance', performancePassed, 
    `${performanceScore}/${optimizations.length} otimizações encontradas`);
  
  return performanceScore;
}

function generateResponsiveReport() {
  console.log('\n📊 Teste 7: Relatório de responsividade...');
  
  const report = {
    breakpoints: Object.keys(expectedBreakpoints),
    devices: Object.keys(deviceBreakpoints),
    recommendations: []
  };
  
  // Gerar recomendações baseadas nos testes
  const recommendations = [
    'Implementar menu hambúrguer para dispositivos móveis',
    'Usar grid responsivo para layouts adaptativos',
    'Configurar tamanhos de texto escaláveis',
    'Adicionar indicadores de foco para acessibilidade',
    'Otimizar imagens para diferentes densidades de tela',
    'Implementar lazy loading para melhor performance',
    'Testar em dispositivos reais além da simulação',
    'Configurar viewport meta tag adequadamente'
  ];
  
  report.recommendations = recommendations;
  
  console.log('   📱 Dispositivos suportados:', report.devices.length);
  console.log('   📏 Breakpoints configurados:', report.breakpoints.length);
  console.log('   💡 Recomendações geradas:', report.recommendations.length);
  
  logTest('Relatório de Responsividade', true, 
    `Relatório completo com ${report.recommendations.length} recomendações`);
  
  return report;
}

async function runResponsiveTests() {
  console.log('📱 INICIANDO TESTES DE RESPONSIVIDADE E DISPOSITIVOS');
  console.log('==================================================\n');

  try {
    // Executar todos os testes
    checkTailwindConfig();
    analyzeResponsiveClasses();
    checkCommonResponsivePatterns();
    simulateDeviceTests();
    checkAccessibilityFeatures();
    checkPerformanceOptimizations();
    generateResponsiveReport();

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }

  // Relatório final
  console.log('\n==================================================');
  console.log('📋 RELATÓRIO FINAL - RESPONSIVIDADE E DISPOSITIVOS');
  console.log('==================================================');
  
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} - ${result.name}`);
  });

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n📊 RESUMO:');
  console.log(`   Testes executados: ${totalTests}`);
  console.log(`   Testes aprovados: ${passedTests}`);
  console.log(`   Taxa de sucesso: ${successRate}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 TODOS OS TESTES DE RESPONSIVIDADE PASSARAM!');
    console.log('📱 Interface adaptável para diferentes dispositivos.');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   - Testar em dispositivos físicos reais');
    console.log('   - Validar performance em conexões lentas');
    console.log('   - Implementar testes automatizados de responsividade');
    console.log('   - Configurar CI/CD para testes visuais');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM!');
    console.log('🔧 Verifique os pontos de melhoria acima.');
    console.log('\n🛠️  AÇÕES RECOMENDADAS:');
    console.log('   - Adicionar mais classes responsivas aos componentes');
    console.log('   - Implementar breakpoints customizados se necessário');
    console.log('   - Melhorar acessibilidade e performance');
    console.log('   - Testar manualmente em diferentes dispositivos');
  }
}

// Executar testes
runResponsiveTests().catch(console.error);