import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { 
  Building2, 
  Users, 
  Settings, 
  Shield,
  Database,
  Palette,
  FileImage,
  TestTube,
  Key,
  Activity
} from "lucide-react"

const SuperAdminDashboard = () => {
  const navigate = useNavigate()

  const stats = [
    {
      title: "Clientes Ativos",
      value: "12",
      description: "Hospitais usando o sistema",
      icon: Building2,
      color: "bg-blue-500",
      change: "+2 este mês"
    },
    {
      title: "Usuários Totais",
      value: "1,247",
      description: "Usuários em todos os clientes",
      icon: Users,
      color: "bg-green-500",
      change: "+89 este mês"
    },
    {
      title: "Uptime do Sistema",
      value: "99.9%",
      description: "Disponibilidade nos últimos 30 dias",
      icon: Activity,
      color: "bg-emerald-500",
      change: "Excelente"
    },
    {
      title: "Configurações Ativas",
      value: "45",
      description: "Personalizações implementadas",
      icon: Settings,
      color: "bg-purple-500",
      change: "+7 esta semana"
    }
  ]

  const quickActions = [
    {
      title: "Criar Novo Cliente",
      description: "Adicionar um novo hospital ao sistema",
      icon: Building2,
      color: "bg-blue-500",
      onClick: () => navigate('/super-admin/create-client')
    },
    {
      title: "Configurar Tema",
      description: "Personalizar aparência para clientes",
      icon: Palette,
      color: "bg-pink-500",
      onClick: () => navigate('/super-admin/client/1/theme')
    },
    {
      title: "Gerenciar Assets",
      description: "Upload de logos e imagens",
      icon: FileImage,
      color: "bg-orange-500",
      onClick: () => navigate('/super-admin/client/1/assets')
    },
    {
      title: "Testes do Sistema",
      description: "Executar testes de funcionalidade",
      icon: TestTube,
      color: "bg-cyan-500",
      onClick: () => navigate('/super-admin/tests')
    },
    {
      title: "Configurar Credenciais",
      description: "Gerenciar chaves de API e configurações",
      icon: Key,
      color: "bg-red-500",
      onClick: () => navigate('/super-admin/credentials')
    },
    {
      title: "Backup do Sistema",
      description: "Realizar backup completo dos dados",
      icon: Database,
      color: "bg-gray-500",
      onClick: () => alert('Funcionalidade em desenvolvimento')
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-red-600" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Painel de controle do sistema MediCare
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Super Administrador
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                <p className="text-xs text-green-600 mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Funcionalidades principais do Super Admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-gray-50"
                  onClick={action.onClick}
                >
                  <div className={`p-2 rounded-full ${action.color}`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{action.title}</div>
                    <div className="text-sm text-gray-600">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>Monitoramento em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Servidor Principal</span>
                <Badge variant="default" className="bg-green-500">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Banco de Dados</span>
                <Badge variant="default" className="bg-green-500">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Externa</span>
                <Badge variant="default" className="bg-green-500">Funcionando</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backup Automático</span>
                <Badge variant="secondary">Agendado</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas ações no sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Novo cliente adicionado</div>
                <div className="text-gray-600">Hospital São Lucas - há 2 horas</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Tema personalizado criado</div>
                <div className="text-gray-600">Cliente ID: 12 - há 4 horas</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Backup realizado</div>
                <div className="text-gray-600">Backup completo - há 6 horas</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Atualização de sistema</div>
                <div className="text-gray-600">Versão 2.1.3 - ontem</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard