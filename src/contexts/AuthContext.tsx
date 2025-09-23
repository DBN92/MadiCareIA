import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'doctor' | 'nurse'
  hospital: string
  isAuthenticated: boolean
  profilePhoto?: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  updateUserProfile: (updatedData: Partial<User>) => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Função para adicionar logs de autenticação
  const addAuthLog = (level: 'info' | 'warning' | 'error', action: string, details: string) => {
    const logEntry = {
      id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      action,
      user: user?.name || 'Sistema',
      details,
      ip: '192.168.1.' + Math.floor(Math.random() * 255),
      module: 'Autenticação'
    };

    // Obter logs existentes
    const existingLogs = JSON.parse(localStorage.getItem('bedside_system_logs') || '[]');
    
    // Adicionar novo log no início
    const updatedLogs = [logEntry, ...existingLogs].slice(0, 1000); // Manter apenas 1000 logs
    
    // Salvar logs atualizados
    localStorage.setItem('bedside_system_logs', JSON.stringify(updatedLogs));
  }

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        if (userData.isAuthenticated) {
          setUser(userData)
          addAuthLog('info', 'Sessão Restaurada', `Usuário ${userData.name} (${userData.email}) teve sua sessão restaurada automaticamente`)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        localStorage.removeItem('user')
        addAuthLog('error', 'Erro de Sessão', 'Falha ao restaurar sessão do usuário - dados corrompidos')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    addAuthLog('info', 'Login Realizado', `Usuário ${userData.name} (${userData.email}) fez login com sucesso - Perfil: ${userData.role}`)
  }

  const updateUserProfile = (updatedData: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...updatedData }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    addAuthLog('info', 'Perfil Atualizado', `Usuário ${updatedUser.name} atualizou dados do perfil`)
  }

  const logout = () => {
    const currentUser = user
    setUser(null)
    localStorage.removeItem('user')
    if (currentUser) {
      addAuthLog('info', 'Logout Realizado', `Usuário ${currentUser.name} (${currentUser.email}) fez logout do sistema`)
    }
  }

  const value = {
    user,
    login,
    logout,
    updateUserProfile,
    isAuthenticated: !!user?.isAuthenticated,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext