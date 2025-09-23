import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface DemoUser {
  id: string;
  email: string;
  demo_token: string;
  expires_at: string;
  is_active: boolean;
}

interface UseDemoAuthReturn {
  isAuthenticated: boolean;
  demoUser: DemoUser | null;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  checkExpiration: () => boolean;
  logout: () => void;
  showExpirationWarning: boolean;
  dismissWarning: () => void;
}

export const useDemoAuth = (): UseDemoAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);
  const navigate = useNavigate();

  // Verificar se está expirando em breve (menos de 2 dias)
  const isExpiringSoon = daysRemaining <= 2 && daysRemaining > 0;

  const checkExpiration = useCallback((): boolean => {
    const token = localStorage.getItem('demo_token');
    const userId = localStorage.getItem('demo_user_id');
    const expiresAt = localStorage.getItem('demo_expires_at');
    
    if (!token || !userId || !expiresAt) {
      setIsAuthenticated(false);
      setDemoUser(null);
      setIsExpired(false);
      setDaysRemaining(0);
      return false;
    }

    const now = new Date();
    const expiration = new Date(expiresAt);
    const timeDiff = expiration.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    setDaysRemaining(Math.max(0, daysDiff));

    if (now > expiration) {
      // Token expirado
      setIsExpired(true);
      setIsAuthenticated(false);
      setShowExpirationWarning(true);
      
      // Limpar dados locais
      localStorage.removeItem('demo_token');
      localStorage.removeItem('demo_user_id');
      localStorage.removeItem('demo_expires_at');
      localStorage.removeItem('demo_days_remaining');
      
      // Desativar usuário no localStorage
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const updatedUsers = existingUsers.map((user: any) => 
        user.id === userId ? { ...user, is_active: false } : user
      );
      localStorage.setItem('demo_users', JSON.stringify(updatedUsers));
      
      return false;
    }

    // Token válido
    const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
    const user = existingUsers.find((u: any) => u.id === userId && u.is_active);
    
    if (user) {
      setDemoUser({
        id: user.id,
        email: user.email,
        demo_token: user.demo_token,
        expires_at: user.expires_at,
        is_active: user.is_active
      });
      setIsAuthenticated(true);
      setIsExpired(false);
      
      // Mostrar aviso se estiver expirando em breve
      if (daysDiff <= 2 && daysDiff > 0) {
        const lastWarning = localStorage.getItem('demo_last_warning');
        const today = new Date().toDateString();
        
        if (lastWarning !== today) {
          setShowExpirationWarning(true);
          localStorage.setItem('demo_last_warning', today);
        }
      }
      
      return true;
    }

    setIsAuthenticated(false);
    setDemoUser(null);
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('demo_token');
    localStorage.removeItem('demo_user_id');
    localStorage.removeItem('demo_expires_at');
    localStorage.removeItem('demo_days_remaining');
    localStorage.removeItem('demo_last_warning');
    
    setIsAuthenticated(false);
    setDemoUser(null);
    setDaysRemaining(0);
    setIsExpired(false);
    setShowExpirationWarning(false);
    
    navigate('/');
  }, [navigate]);

  const dismissWarning = useCallback(() => {
    setShowExpirationWarning(false);
  }, []);

  // Verificar autenticação na inicialização
  useEffect(() => {
    checkExpiration();
  }, [checkExpiration]);

  // Verificar expiração periodicamente (a cada minuto)
  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiration();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [checkExpiration]);

  // Verificar expiração quando a aba ganha foco
  useEffect(() => {
    const handleFocus = () => {
      checkExpiration();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkExpiration]);

  return {
    isAuthenticated,
    demoUser,
    daysRemaining,
    isExpired,
    isExpiringSoon,
    checkExpiration,
    logout,
    showExpirationWarning,
    dismissWarning
  };
};