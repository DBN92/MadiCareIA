import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

interface DemoUser {
  id: string;
  email: string;
  password_hash: string;
  demo_token: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

const DemoLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Função para hash da senha (mesmo algoritmo do cadastro)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'demo_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
      // Buscar usuários demo do localStorage
      const existingUsers: DemoUser[] = JSON.parse(localStorage.getItem('demo_users') || '[]');
      
      // Hash da senha fornecida
      const passwordHash = await hashPassword(password);
      
      // Encontrar usuário
      const user = existingUsers.find(u => 
        u.email === email && 
        u.password_hash === passwordHash &&
        u.is_active
      );

      if (!user) {
        setError('Email ou senha incorretos.');
        setIsLoading(false);
        return;
      }

      // Verificar se a conta não expirou
      const now = new Date();
      const expiresAt = new Date(user.expires_at);
      
      if (now > expiresAt) {
        // Desativar conta expirada
        const updatedUsers = existingUsers.map(u => 
          u.id === user.id ? { ...u, is_active: false } : u
        );
        localStorage.setItem('demo_users', JSON.stringify(updatedUsers));
        
        setError('Sua conta demo expirou. Por favor, cadastre-se novamente.');
        setIsLoading(false);
        return;
      }

      // Calcular dias restantes
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Salvar token no localStorage para autenticação
      localStorage.setItem('demo_token', user.demo_token);
      localStorage.setItem('demo_user_id', user.id);
      localStorage.setItem('demo_expires_at', user.expires_at);
      localStorage.setItem('demo_days_remaining', daysRemaining.toString());
      
      // Atualizar último login
      const updatedUsers = existingUsers.map(u => 
        u.id === user.id ? { ...u, last_login: new Date().toISOString() } : u
      );
      localStorage.setItem('demo_users', JSON.stringify(updatedUsers));
      
      // Redirecionar para dashboard demo
      navigate('/demo/dashboard');
      
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Login Demo
          </h2>
          <p className="text-gray-600">
            Acesse sua conta demo do MediCare
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Não tem uma conta demo?{' '}
              <button
                onClick={() => navigate('/demo/signup')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Cadastre-se aqui
              </button>
            </p>
            <p className="text-sm text-gray-600">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Voltar ao início
              </button>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Acesso demo válido por 7 dias
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;