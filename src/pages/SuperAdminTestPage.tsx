import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, TestTube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  duration?: number
  error?: string
}

export default function SuperAdminTestPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: '1', name: 'Conexão com Banco de Dados', status: 'pending' },
    { id: '2', name: 'Autenticação de Usuários', status: 'pending' },
    { id: '3', name: 'API de Pacientes', status: 'pending' },
    { id: '4', name: 'Sistema de Cuidados', status: 'pending' },
    { id: '5', name: 'Relatórios e Exportação', status: 'pending' },
    { id: '6', name: 'Notificações', status: 'pending' },
    { id: '7', name: 'Backup Automático', status: 'pending' },
    { id: '8', name: 'Segurança e Permissões', status: 'pending' }
  ])

  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestProgress(0)
    
    // Reset all tests to pending
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending' as const })))
    
    for (let i = 0; i < testResults.length; i++) {
      const test = testResults[i]
      
      // Mark test as running
      setTestResults(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' as const } : t
      ))
      
      // Simulate test execution
      const duration = Math.random() * 2000 + 500 // 0.5-2.5 seconds
      await new Promise(resolve => setTimeout(resolve, duration))
      
      // Random result (90% pass rate)
      const passed = Math.random() > 0.1
      const result: TestResult = {
        ...test,
        status: passed ? 'passed' : 'failed',
        duration: Math.round(duration),
        error: passed ? undefined : 'Erro simulado para demonstração'
      }
      
      setTestResults(prev => prev.map(t => 
        t.id === test.id ? result : t
      ))
      
      setTestProgress(((i + 1) / testResults.length) * 100)
    }
    
    setIsRunningTests(false)
    
    const passedTests = testResults.filter(t => t.status === 'passed').length
    const totalTests = testResults.length
    
    toast({
      title: "Testes concluídos!",
      description: `${passedTests}/${totalTests} testes passaram com sucesso.`,
      variant: passedTests === totalTests ? "default" : "destructive"
    })
  }

  const runSingleTest = async (testId: string) => {
    const test = testResults.find(t => t.id === testId)
    if (!test) return

    setTestResults(prev => prev.map(t => 
      t.id === testId ? { ...t, status: 'running' as const } : t
    ))

    const duration = Math.random() * 2000 + 500
    await new Promise(resolve => setTimeout(resolve, duration))

    const passed = Math.random() > 0.1
    const result: TestResult = {
      ...test,
      status: passed ? 'passed' : 'failed',
      duration: Math.round(duration),
      error: passed ? undefined : 'Erro simulado para demonstração'
    }

    setTestResults(prev => prev.map(t => 
      t.id === testId ? result : t
    ))
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-500">Passou</Badge>
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>
      case 'running':
        return <Badge variant="secondary">Executando</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  const passedTests = testResults.filter(t => t.status === 'passed').length
  const failedTests = testResults.filter(t => t.status === 'failed').length
  const totalTests = testResults.length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/super-admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <TestTube className="h-8 w-8 text-cyan-600" />
              Testes do Sistema
            </h1>
            <p className="text-gray-600 mt-1">
              Execute testes automatizados para verificar a integridade do sistema
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Testes</p>
                  <p className="text-2xl font-bold">{totalTests}</p>
                </div>
                <TestTube className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Testes Passaram</p>
                  <p className="text-2xl font-bold text-green-600">{passedTests}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Testes Falharam</p>
                  <p className="text-2xl font-bold text-red-600">{failedTests}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold">
                    {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
                  </p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Controles de Teste</CardTitle>
            <CardDescription>
              Execute todos os testes ou testes individuais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={runAllTests}
                disabled={isRunningTests}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isRunningTests ? 'Executando Testes...' : 'Executar Todos os Testes'}
              </Button>
              
              {isRunningTests && (
                <div className="flex-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <Progress value={testProgress} className="flex-1" />
                    <span className="text-sm text-gray-600">{Math.round(testProgress)}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
            <CardDescription>
              Status detalhado de cada teste do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(test.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{test.name}</h4>
                      {test.duration && (
                        <p className="text-sm text-gray-500">
                          Executado em {test.duration}ms
                        </p>
                      )}
                      {test.error && (
                        <p className="text-sm text-red-600">{test.error}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runSingleTest(test.id)}
                      disabled={test.status === 'running' || isRunningTests}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}