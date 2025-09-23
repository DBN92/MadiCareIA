import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

export default function SuperAdminLoginSimple() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/super-admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Super admin de exemplo para demonstração
  const mockSuperAdmin = {
    email: 'superadmin@medicare.com',
    password: 'superadmin123',
    role: 'super_admin',
    name: 'Super Administrador',
    hospital: 'MediCare System'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Verificar credenciais do super admin
      if (email === mockSuperAdmin.email && password === mockSuperAdmin.password) {
        await login(mockSuperAdmin)
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${mockSuperAdmin.name}`,
        })
        navigate('/super-admin/dashboard')
      } else {
        setError('Credenciais inválidas para Super Administrador')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro interno do servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-sm text-gray-600">Login Simples</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="superadmin@medicare.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/super-admin/login')}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Login Completo
          </button>
        </div>
      </div>
    </div>
  )
}