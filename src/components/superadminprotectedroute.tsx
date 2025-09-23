import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ReactNode } from 'react'

interface SuperAdminProtectedRouteProps {
  children: ReactNode
}

export default function SuperAdminProtectedRoute({ children }: SuperAdminProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/super-admin/login" state={{ from: location }} replace />
  }

  // Verificar se é super admin
  if (user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-gray-500">
            Seu nível de acesso: <span className="font-medium">{user.role}</span>
          </p>
          <p className="text-sm text-gray-500">
            Nível necessário: <span className="font-medium">super_admin</span>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}