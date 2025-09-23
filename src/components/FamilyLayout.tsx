import { Heart, Home, Activity, FileText, ArrowLeft, Shield, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Patient } from "@/hooks/usePatients"
import { FamilyPermissions } from "@/hooks/useFamilyAccess"
import { useNavigate } from "react-router-dom"

interface FamilyLayoutProps {
  children: React.ReactNode
  patient: Patient
  permissions?: FamilyPermissions | null
  currentPage?: 'dashboard' | 'care' | 'reports'
}

const getRoleInfo = (permissions: FamilyPermissions | null) => {
  if (!permissions) return { role: 'Carregando...', icon: Shield, color: 'bg-gray-100 text-gray-800' }
  
  if (permissions.canEdit) {
    return {
      role: 'Editor',
      icon: Edit,
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Pode visualizar e registrar cuidados'
    }
  } else {
    return {
      role: 'Visualizador',
      icon: Eye,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Pode apenas visualizar informações'
    }
  }
}

export function FamilyLayout({ children, patient, permissions, currentPage = 'dashboard' }: FamilyLayoutProps) {
  const navigate = useNavigate()

  const getAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const allNavigationItems = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: Home,
      path: 'dashboard',
      requiresPermission: null // Sempre disponível
    },
    {
      id: 'care',
      label: 'Registrar Cuidados',
      icon: Activity,
      path: 'care',
      requiresPermission: 'canEdit' // Apenas para editores
    },

  ]

  // Filtrar itens de navegação baseado nas permissões
  const navigationItems = allNavigationItems.filter(item => {
    if (!item.requiresPermission) return true
    if (!permissions) return false
    return permissions[item.requiresPermission as keyof FamilyPermissions]
  })

  const handleNavigation = (path: string) => {
    const currentUrl = window.location.pathname
    const baseUrl = currentUrl.split('/').slice(0, -1).join('/')
    navigate(`${baseUrl}/${path}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header com informações do paciente */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Painel Familiar
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Acompanhamento de {patient.full_name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50">
                Leito {patient.bed}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {getAge(patient.birth_date)} anos
              </Badge>
              {(() => {
                const roleInfo = getRoleInfo(permissions)
                const RoleIcon = roleInfo.icon
                return (
                  <Badge 
                    variant="outline" 
                    className={`${roleInfo.color} border font-medium`}
                    title={roleInfo.description}
                  >
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {roleInfo.role}
                  </Badge>
                )
              })()}
            </div>
          </div>
        </div>
      </header>

      {/* Informações do paciente */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Heart className="h-5 w-5 text-red-500" />
              Informações do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                  {patient.photo ? (
                    <img
                      src={patient.photo}
                      alt={`Foto de ${patient.full_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                      <Heart className="h-10 w-10 text-primary/60" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nome Completo</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{patient.full_name}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data de Nascimento</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Leito</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{patient.bed}</p>
              </div>
              {patient.notes && (
                <div className="md:col-span-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Observações</p>
                  <p className="text-gray-900 dark:text-gray-100">{patient.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-2 whitespace-nowrap ${
                  isActive 
                    ? 'bg-primary hover:bg-primary/90 text-white' 
                    : 'bg-white/70 hover:bg-white/90 text-gray-700 border-gray-300 dark:bg-gray-800/70 dark:hover:bg-gray-800/90 dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </div>

        {/* Conteúdo principal */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}