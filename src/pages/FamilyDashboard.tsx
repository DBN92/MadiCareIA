import { useParams, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FamilyLayout } from '@/components/FamilyLayout'
import FamilyCare from '@/components/FamilyCare'

import { useFamilyAccess, FamilyPermissions, FamilyAccessToken } from '@/hooks/useFamilyAccess'
import { useCareEvents } from '@/hooks/useCareEvents'
import { useEffect, useState } from 'react'
import { Patient } from '@/hooks/usePatients'
import { 
  Heart, 
  Calendar,
  Clock,
  Droplets,
  Pill,
  Activity,
  Utensils,
  Toilet,
  AlertCircle,
  Shield,
  Eye,
  Edit,
  Info
} from 'lucide-react'

const FamilyDashboard = () => {
  const { patientId, token } = useParams<{ patientId: string; token: string }>()
  const [searchParams] = useSearchParams()
  const location = window.location.pathname
  
  // Detectar view baseada na URL
  let currentView = searchParams.get('view') || 'dashboard'
  if (location.endsWith('/care')) {
    currentView = 'care'
  } else if (location.endsWith('/reports')) {
    currentView = 'reports'
  }
  const { validateTokenWithData, getPermissions, generateFamilyToken } = useFamilyAccess()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [permissions, setPermissions] = useState<FamilyPermissions | null>(null)
  const [tokenData, setTokenData] = useState<FamilyAccessToken | null>(null)
  const { events } = useCareEvents(patient?.id)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateAccess = async () => {
      if (!patientId || !token) {
        setError('Token ou ID do paciente não encontrado')
        setLoading(false)
        return
      }

      try {
        const result = await validateTokenWithData(patientId, token)
        if (result.isValid && result.patient && result.tokenData) {
          setPatient(result.patient)
          setTokenData(result.tokenData)
          setPermissions(getPermissions(result.tokenData.role))
        } else {
          // Token inválido - criar automaticamente um novo token
          console.log('🔄 Token inválido, criando automaticamente...')
          try {
            const newToken = await generateFamilyToken(patientId, 'editor')
            console.log('✅ Token criado automaticamente:', newToken.token)
            
            // Revalidar com o novo token
            const newResult = await validateTokenWithData(patientId, newToken.token)
            if (newResult.isValid && newResult.patient && newResult.tokenData) {
              setPatient(newResult.patient)
              setTokenData(newResult.tokenData)
              setPermissions(getPermissions(newResult.tokenData.role))
            } else {
              setError('Erro ao validar novo token criado')
            }
          } catch (tokenError) {
            console.error('❌ Erro ao criar token automaticamente:', tokenError)
            setError('Erro ao criar token de acesso automaticamente')
          }
        }
      } catch (err) {
        setError('Erro ao validar acesso')
      } finally {
        setLoading(false)
      }
    }

    validateAccess()
  }, [patientId, token, validateTokenWithData, getPermissions, generateFamilyToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validando acesso...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              {error || 'Token inválido ou expirado.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filtrar eventos do paciente específico
  const patientEvents = events.filter(event => event.patient_id === patientId)

  // Eventos de hoje
  const today = new Date().toISOString().split('T')[0]
  const todayEvents = patientEvents.filter(event => 
    event.created_at.startsWith(today)
  )

  // Eventos recentes (últimos 10)
  const recentEvents = patientEvents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  // Estatísticas do dia
  const todayStats = {
    liquids: todayEvents
      .filter(e => e.type === 'drink' && e.volume_ml)
      .reduce((total, event) => total + (event.volume_ml || 0), 0),
    medications: todayEvents.filter(e => e.type === 'med').length,
    meals: todayEvents.filter(e => e.type === 'meal').length,
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drink': return Droplets
      case 'med': return Pill
      case 'note': return Activity
      case 'meal': return Utensils
      case 'bathroom': return Toilet
      default: return Heart
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'drink': return 'text-primary'
      case 'med': return 'text-secondary'
      case 'note': return 'text-accent'
      case 'meal': return 'text-muted-foreground'
      case 'bathroom': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'drink': return 'Líquidos'
      case 'med': return 'Medicamentos'
      case 'note': return 'Anotações'
      case 'meal': return 'Alimentação'
      case 'bathroom': return 'Banheiro'
      default: return 'Outros'
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'drink': return 'bg-primary/10 text-primary border-primary/20'
      case 'med': return 'bg-secondary/10 text-secondary border-secondary/20'
      case 'note': return 'bg-accent/10 text-accent border-accent/20'
      case 'meal': return 'bg-muted text-muted-foreground border-muted'
      case 'bathroom': return 'bg-muted text-muted-foreground border-muted'
      default: return 'bg-muted text-muted-foreground border-muted'
    }
  }

  const getEventDescription = (event: any) => {
    switch (event.type) {
      case 'drink':
        return `Hidratação${event.volume_ml ? ` - ${event.volume_ml}ml` : ''}`
      case 'med':
        return `${event.med_name || 'Medicamento'}${event.med_dose ? ` - ${event.med_dose}` : ''}`
      case 'meal':
        return event.meal_desc || 'Refeição'
      case 'bathroom':
        return `Banheiro${event.bathroom_type ? ` - ${event.bathroom_type}` : ''}`
      case 'note':
        return event.notes || 'Anotação'
      default:
        return 'Atividade'
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Informações de Acesso */}
      {permissions && (
        <Card className="medical-card border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Seu Nível de Acesso</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                permissions.canEdit 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                {permissions.canEdit ? (
                  <Edit className="h-6 w-6" />
                ) : (
                  <Eye className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  {permissions.canEdit ? 'Editor' : 'Visualizador'}
                </h3>
                <p className="text-muted-foreground mb-3">
                  {permissions.canEdit 
                    ? 'Você pode visualizar todas as informações e registrar novos cuidados para o paciente.'
                    : 'Você pode visualizar todas as informações do paciente, mas não pode registrar novos cuidados.'
                  }
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className={`flex items-center gap-1 ${
                    permissions.canView ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <Eye className="h-3 w-3" />
                    Visualizar
                  </div>
                  <div className={`flex items-center gap-1 ${
                    permissions.canRegisterLiquids ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <Droplets className="h-3 w-3" />
                    Líquidos
                  </div>
                  <div className={`flex items-center gap-1 ${
                    permissions.canRegisterMedications ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <Pill className="h-3 w-3" />
                    Medicamentos
                  </div>
                  <div className={`flex items-center gap-1 ${
                    permissions.canRegisterMeals ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <Utensils className="h-3 w-3" />
                    Refeições
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Diárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="medical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Líquidos Hoje
              </CardTitle>
              <Droplets className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {todayStats.liquids}ml
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayEvents.filter(e => e.type === 'drink').length} registros
            </p>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Medicamentos
              </CardTitle>
              <Pill className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {todayStats.medications}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              doses hoje
            </p>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Refeições
              </CardTitle>
              <Utensils className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {todayStats.meals}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              refeições hoje
            </p>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Atividades
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {todayEvents.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              registros hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>
            Últimos registros de cuidados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma atividade registrada ainda hoje.
                </p>
              </div>
            ) : (
              recentEvents.map((event) => {
                const IconComponent = getTypeIcon(event.type)
                return (
                  <div key={event.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className={`p-2 rounded-lg bg-background ${getTypeColor(event.type)}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {getEventDescription(event)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge className={getBadgeColor(event.type)}>
                      {getTypeLabel(event.type)}
                    </Badge>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Paciente */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Informações do Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
              {patient.photo ? (
                <img
                  src={patient.photo}
                  alt={`Foto de ${patient.full_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary/60" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{patient.full_name}</h3>
              <p className="text-sm text-muted-foreground">Leito {patient.bed}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data de Nascimento</p>
              <p className="font-medium text-foreground">
                {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Leito</p>
              <p className="font-medium text-foreground">{patient.bed}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data de Internação</p>
              <p className="font-medium text-foreground">
                {new Date(patient.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Idade</p>
              <p className="font-medium text-foreground">
                {new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} anos
              </p>
            </div>
          </div>
          {patient.notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-1">Observações</p>
              <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                {patient.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (currentView) {
      case 'care':
        return <FamilyCare patient={patient} permissions={permissions} />

      default:
        return renderDashboard()
    }
  }

  return (
    <FamilyLayout 
      patient={patient} 
      permissions={permissions}
      currentPage={currentView as 'dashboard' | 'care'}
    >
      {renderContent()}
    </FamilyLayout>
  )
}

export default FamilyDashboard