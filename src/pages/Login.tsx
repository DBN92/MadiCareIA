import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, User, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import ColoSaudeLogo from '../components/ColoSaudeLogo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Usuários de exemplo para demonstração
  const mockUsers = [
    {
      email: 'admin@hospital.com',
      password: 'admin123',
      role: 'admin',
      name: 'Administrador Sistema',
      hospital: 'Hospital Central'
    },
    {
      email: 'amir.charruf@hospital.com',
      password: 'amir123',
      role: 'doctor',
      name: 'Dr. Amir Charruf',
      hospital: 'Hospital Central'
    },
    {
      email: 'maria.santos@hospital.com',
      password: 'enfermeira123',
      role: 'nurse',
      name: 'Enfª Maria Santos',
      hospital: 'Hospital Central'
    }
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar credenciais
    const user = mockUsers.find(u => u.email === email && u.password === password)

    if (user) {
      // Usar o contexto de autenticação para fazer login
      const userData = {
        id: Date.now().toString(),
        email: user.email,
        name: user.name,
        role: user.role as 'admin' | 'doctor' | 'nurse',
        hospital: user.hospital,
        isAuthenticated: true
      }
      login(userData)

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${user.name}`,
      })

      // Redirecionar para o dashboard
      navigate('/', { replace: true })
    } else {
      setError('Email ou senha incorretos. Tente novamente.')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-red-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-red-100">
            <ColoSaudeLogo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-red-900">MediCare</h1>
          <p className="text-red-700">Sistema de Gestão Hospitalar</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-red-100 bg-white">
          <CardHeader className="space-y-1 bg-gradient-to-r from-red-800 to-red-900 text-white rounded-t-lg">
            <CardTitle className="text-2xl text-center text-white">Entrar</CardTitle>
            <CardDescription className="text-center text-red-100">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-red-900 font-medium">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-red-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-red-200 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-red-900 font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-red-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-red-200 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-red-50"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-red-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-red-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white font-medium py-2.5"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
              <h3 className="text-sm font-medium text-red-900 mb-2">Credenciais de Demonstração:</h3>
              <div className="space-y-2 text-xs text-red-700">
                <div>
                  <strong>Administrador:</strong> admin@hospital.com / admin123
                </div>
                <div>
                  <strong>Médico:</strong> amir.charruf@hospital.com / amir123
                </div>
                <div>
                  <strong>Enfermeiro:</strong> maria.santos@hospital.com / enfermeira123
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-red-600">
          © 2024 MediCare. Todos os direitos reservados.
        </div>
      </div>
    </div>
  )
}