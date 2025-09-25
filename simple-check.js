console.log('Checking patients table structure...');

// Simular uma consulta para ver o que acontece
const testQuery = {
  from: 'patients',
  select: '*',
  limit: 1
};

console.log('Query que seria executada:', testQuery);
console.log('Erro esperado: column patients.name does not exist');
console.log('Isso sugere que a coluna se chama algo diferente de "name"');
