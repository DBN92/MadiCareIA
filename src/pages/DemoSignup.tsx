import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DemoUser {
  id: string;
  email: string;
  demo_token: string;
  expires_at: string;
}

const DemoSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<DemoUser | null>(null);
  const navigate = useNavigate();

  const generateDemoToken = () => {
    return 'demo_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const hashPassword = async (password: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'demo_salt_2024');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um email válido');
      return false;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se email já está em uso localmente
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      if (existingUsers.some((user: any) => user.email === email)) {
        setError('Este email já está cadastrado. Tente fazer login ou use outro email.');
        setIsLoading(false);
        return;
      }

      // Gerar token e hash da senha
      const demoToken = generateDemoToken();
      const passwordHash = await hashPassword(password);
      const userId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Criar usuário demo localmente
      const newUser = {
        id: userId,
        email: email,
        password_hash: passwordHash,
        demo_token: demoToken,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true
      };

      // Salvar no localStorage
      existingUsers.push(newUser);
      localStorage.setItem('demo_users', JSON.stringify(existingUsers));

      setSuccess(newUser);
      
      // Salvar token no localStorage para acesso automático
      localStorage.setItem('demo_token', demoToken);
      localStorage.setItem('demo_user_id', userId);
      localStorage.setItem('demo_user_email', email);
      localStorage.setItem('demo_expires_at', newUser.expires_at);

    } catch (error) {
      console.error('Erro no cadastro:', error);
      setError('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessDemo = () => {
    if (success) {
      // Redirecionar para o dashboard demo
      navigate('/demo/dashboard');
    }
  };

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Conta Demo Criada!
            </CardTitle>
            <CardDescription>
              Sua conta demo foi criada com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">Detalhes da sua conta:</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Email: {success.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Expira em: {formatExpirationDate(success.expires_at)}</span>
                </div>
              </div>
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Sua conta demo é válida por 7 dias. 
                Após este período, todos os dados serão automaticamente removidos.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={handleAccessDemo}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                Acessar Demo
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/demo/login')}
                className="w-full"
              >
                Fazer Login Depois
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Token: <code className="bg-gray-100 px-1 rounded">{success.demo_token}</code>
              <br />
              <span className="text-gray-400">Guarde este token para acessar sua conta</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Criar Conta Demo
          </CardTitle>
          <CardDescription>
            Teste o MediCare gratuitamente por 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-primary mb-2">O que você terá acesso:</h3>
              <ul className="text-sm text-primary/80 space-y-1">
                <li>• Gerenciamento completo de pacientes</li>
                <li>• Registro de cuidados e medicamentos</li>
                <li>• Relatórios detalhados</li>
                <li>• Acesso familiar com tokens</li>
                <li>• Interface responsiva</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta Demo'
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Já tem uma conta demo?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/demo/login')}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Fazer Login
                </button>
              </p>
              
              <p className="text-xs text-gray-500">
                Conta demo válida por 7 dias • Dados removidos automaticamente após expiração
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoSignup;