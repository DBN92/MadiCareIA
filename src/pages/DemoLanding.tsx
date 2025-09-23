import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  Play,
  Star
} from 'lucide-react';
import ColoSaudeLogo from '../components/ColoSaudeLogo'

const DemoLanding: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Cuidados Personalizados',
      description: 'Registre e acompanhe cuidados específicos para cada paciente'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Acesso Familiar',
      description: 'Familiares podem acompanhar o progresso com tokens seguros'
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Relatórios Detalhados',
      description: 'Gere relatórios completos de cuidados e medicações'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Dashboard Intuitivo',
      description: 'Visualize dados importantes de forma clara e organizada'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Segurança Total',
      description: 'Dados protegidos com criptografia e controle de acesso'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Histórico Completo',
      description: 'Mantenha registro detalhado de todos os cuidados'
    }
  ];

  const benefits = [
    'Interface intuitiva e fácil de usar',
    'Acesso multiplataforma (web, tablet, mobile)',
    'Relatórios em PDF personalizáveis',
    'Sistema de notificações inteligente',
    'Backup automático na nuvem',
    'Suporte técnico especializado'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <ColoSaudeLogo size="md" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MediCare</h1>
              <p className="text-sm text-primary font-medium">DEMO</p>
            </div>
          </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/demo/login')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Já tenho conta
              </button>
              <button 
                onClick={() => navigate('/demo/login')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors"
              >
                Entrar na Demo
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Play className="h-4 w-4" />
              <span>Demonstração Gratuita • 7 Dias</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Cuidados de Saúde
              <span className="text-primary block">Simplificados</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Teste o MediCare gratuitamente por 7 dias. 
              Gerencie cuidados de pacientes, compartilhe informações com familiares 
              e gere relatórios profissionais.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/demo/signup')}
                className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 text-lg"
              >
                <span>Começar Demo Gratuito</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => navigate('/demo/login')}
                className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 border border-gray-300 transition-colors text-lg"
              >
                Fazer Login
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Acesso completo</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>7 dias grátis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubra como o MediCare pode transformar o cuidado de pacientes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Por que escolher o
                <span className="text-primary block">MediCare?</span>
              </h2>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <button
                  onClick={() => navigate('/demo/signup')}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center space-x-2"
                >
                  <span>Experimentar Agora</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Demo Completo
                </h3>
                <p className="text-gray-600 mb-6">
                  Acesso total a todas as funcionalidades por 7 dias. 
                  Teste com dados reais e veja como pode melhorar seu trabalho.
                </p>
                
                <div className="bg-primary/10 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-semibold text-primary">7 dias completos</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Funcionalidades:</span>
                    <span className="font-semibold text-primary">100% liberadas</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Suporte:</span>
                    <span className="font-semibold text-primary">Incluído</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/demo/signup')}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Começar Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Crie sua conta demo em menos de 2 minutos e comece a usar imediatamente.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/demo/signup')}
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 text-lg"
            >
              <span>Criar Conta Demo</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <ColoSaudeLogo size="md" className="mr-3" />
          </div>
              <span className="text-lg font-semibold">MediCare Demo</span>
            </div>
            
            <div className="text-sm text-gray-400">
              © 2024 MediCare. Ambiente de demonstração.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoLanding;