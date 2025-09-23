import React, { useEffect } from 'react';
import { useDemoAuth } from '../hooks/useDemoAuth';
import DemoExpiredModal from './DemoExpiredModal';
import { Clock, AlertTriangle } from 'lucide-react';

interface DemoGuardProps {
  children: React.ReactNode;
}

const DemoGuard: React.FC<DemoGuardProps> = ({ children }) => {
  const {
    isAuthenticated,
    demoUser,
    daysRemaining,
    isExpired,
    isExpiringSoon,
    showExpirationWarning,
    dismissWarning,
    logout
  } = useDemoAuth();

  // Verificar se está em modo demo
  const isDemoMode = localStorage.getItem('demo_token') !== null;

  // Se não estiver em modo demo, renderizar normalmente
  if (!isDemoMode) {
    return <>{children}</>;
  }

  // Se estiver expirado, mostrar modal
  if (isExpired) {
    return (
      <DemoExpiredModal
        isOpen={true}
        onClose={() => {}}
        daysRemaining={0}
      />
    );
  }

  // Se não estiver autenticado no demo, redirecionar
  if (!isAuthenticated) {
    window.location.href = '/demo/login';
    return null;
  }

  return (
    <>
      {/* Banner de demo */}
      <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>
            Modo Demo - {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''}
          </span>
          {demoUser && (
            <span className="opacity-75">• {demoUser.email}</span>
          )}
        </div>
      </div>

      {/* Aviso de expiração em breve */}
      {isExpiringSoon && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-yellow-700">
                <strong>Atenção:</strong> Seu demo expira em {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}.
                Todos os dados serão removidos após a expiração.
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/demo/signup'}
              className="ml-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm font-medium hover:bg-yellow-200 transition-colors"
            >
              Renovar Demo
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      {children}

      {/* Modal de aviso de expiração */}
      <DemoExpiredModal
        isOpen={showExpirationWarning}
        onClose={dismissWarning}
        daysRemaining={daysRemaining}
      />
    </>
  );
};

export default DemoGuard;