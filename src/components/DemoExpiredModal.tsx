import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface DemoExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining?: number;
}

const DemoExpiredModal: React.FC<DemoExpiredModalProps> = ({ 
  isOpen, 
  onClose, 
  daysRemaining = 0 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNewDemo = () => {
    // Limpar dados do demo atual
    localStorage.removeItem('demo_token');
    localStorage.removeItem('demo_user_id');
    localStorage.removeItem('demo_expires_at');
    localStorage.removeItem('demo_days_remaining');
    
    // Redirecionar para novo cadastro
    navigate('/demo/signup');
  };

  const handleGoHome = () => {
    // Limpar dados do demo atual
    localStorage.removeItem('demo_token');
    localStorage.removeItem('demo_user_id');
    localStorage.removeItem('demo_expires_at');
    localStorage.removeItem('demo_days_remaining');
    
    // Redirecionar para home
    navigate('/');
  };

  const isExpired = daysRemaining <= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
            isExpired ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            {isExpired ? (
              <AlertTriangle className="h-8 w-8 text-red-600" />
            ) : (
              <Clock className="h-8 w-8 text-yellow-600" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isExpired ? 'Demo Expirado' : 'Demo Expirando'}
          </h3>
          
          {isExpired ? (
            <div className="space-y-2">
              <p className="text-gray-600">
                Seu período de demonstração de 7 dias chegou ao fim.
              </p>
              <p className="text-sm text-gray-500">
                Todos os dados do demo foram removidos por segurança.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                Seu demo expira em <span className="font-semibold text-yellow-600">
                  {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}
                </span>.
              </p>
              <p className="text-sm text-gray-500">
                Após a expiração, todos os dados serão removidos.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isExpired ? (
            <>
              <button
                onClick={handleNewDemo}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Criar Novo Demo</span>
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="h-5 w-5" />
                <span>Voltar ao Início</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Continuar Usando
              </button>
              
              <button
                onClick={handleNewDemo}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Renovar Demo</span>
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-white border border-primary/20 rounded-lg">
              <p className="text-xs text-primary text-center">
            <strong>MediCare Demo:</strong> Ambiente de teste com dados fictícios.
            Para uso profissional, entre em contato conosco.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoExpiredModal;