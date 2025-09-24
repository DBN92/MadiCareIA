import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImportExportModal } from "@/components/ImportExportModal"
import { usePatients } from "@/hooks/usePatients"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Heart,
  Droplets,
  Pill,
  Database,
  Sparkles,
  ArrowUpRight
} from "lucide-react"

const Dashboard = () => {
  const navigate = useNavigate()
  const [showImportExport, setShowImportExport] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { patients, loading: patientsLoading } = usePatients()
  const { events, getTodayStats } = useCareEvents()
  const isMobile = useIsMobile()
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  const todayStats = getTodayStats()
  const activePatientsCount = patients.length
  const criticalPatients = patients.filter(p => p.notes?.toLowerCase().includes('crítico')).length

  const stats = [
    {
      title: "Pacientes Ativos",
      value: activePatientsCount.toString(),
      description: "Pacientes internados hoje",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      change: "+2 desde ontem",
      trend: "up",
      onClick: () => navigate('/patients')
    },
    {
      title: "Cuidados Registrados",
      value: todayStats.total.toString(),
      description: "Registros nas últimas 24h",
      icon: Activity,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      change: "+18 desde ontem",
      trend: "up",
      onClick: () => navigate('/care')
    },
    {
      title: "Medicamentos",
      value: todayStats.medications.toString(),
      description: "Doses administradas hoje",
      icon: Pill,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      change: "+12 desde ontem",
      trend: "up",
      onClick: () => navigate('/care')
    },
    {
      title: "Alertas Pendentes",
      value: criticalPatients.toString(),
      description: "Requerem atenção",
      icon: AlertTriangle,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      change: "-1 desde ontem",
      trend: "down",
      onClick: () => navigate('/patients')
    }
  ]

  const recentPatients = patients.slice(0, 3).map(patient => {
    const lastEvent = events.find(e => e.patient_id === patient.id)
    const age = patient.birth_date ? 
      new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : 0
    
    return {
      id: patient.id,
      name: patient.full_name,
      room: patient.bed,
      status: patient.notes?.toLowerCase().includes('crítico') ? 'Crítico' : 'Estável',
      lastCare: lastEvent ? new Date(lastEvent.occurred_at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '--:--',
      priority: patient.notes?.toLowerCase().includes('crítico') ? 'Alta' : 'Normal'
    }
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-destructive text-destructive-foreground'
      case 'Média': return 'bg-warning text-warning-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Header with Glassmorphism */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground">Visão geral dos cuidados hospitalares</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => setShowImportExport(true)} 
                className="w-full sm:w-auto glass-button group hover:scale-105 transition-all duration-300"
              >
                <Database className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline">Import/Export</span>
                <span className="sm:hidden">Dados</span>
              </Button>
              <Button 
                variant="default" 
                onClick={() => navigate('/care')} 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                <Activity className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">Novo Registro</span>
                <span className="sm:hidden">Registro</span>
                <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with Advanced Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 ${
              hoveredCard === index ? 'shadow-2xl shadow-blue-500/25' : 'shadow-lg hover:shadow-xl'
            }`}
            onClick={stat.onClick}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              animationDelay: `${index * 150}ms`,
              animation: isVisible ? 'slideInUp 0.6s ease-out forwards' : 'none'
            }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
            
            {/* Glass Effect */}
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {stat.title}
              </CardTitle>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {stat.description}
              </p>
              <div className="flex items-center mt-3 space-x-2">
                <div className={`p-1 rounded-full ${stat.trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <TrendingUp className={`h-3 w-3 ${stat.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400 rotate-180'}`} />
                </div>
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Patients with Modern Design */}
        <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Pacientes Recentes
                </span>
              </div>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Últimos pacientes com registros de cuidados
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            {recentPatients.map((patient, index) => (
              <div 
                key={patient.id} 
                className="group/item relative p-4 border border-border/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] backdrop-blur-sm"
                onClick={() => navigate(`/care?patient=${patient.id}`)}
                style={{
                  animationDelay: `${(index + 4) * 100}ms`,
                  animation: isVisible ? 'slideInLeft 0.6s ease-out forwards' : 'none'
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                        {patients.find(p => p.id === patient.id)?.photo ? (
                          <img
                            src={patients.find(p => p.id === patient.id)?.photo}
                            alt={`Foto de ${patient.name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <Heart className="h-6 w-6 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors duration-300">
                        {patient.name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Quarto {patient.room}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto">
                    <Badge className={`${getPriorityColor(patient.priority)} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                      {patient.priority}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      {patient.lastCare}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions with Enhanced Design */}
        <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3">
              <div className={`bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg ${isMobile ? 'p-1.5' : 'p-2'}`}>
                <Activity className={`text-white ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </div>
              <div>
                <span className={`font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Ações Rápidas
                </span>
              </div>
            </CardTitle>
            <CardDescription className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
              Registros frequentes de cuidados
            </CardDescription>
          </CardHeader>
          <CardContent className={`relative ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            {[
              { icon: Droplets, label: "Registrar Líquidos", shortLabel: "Líquidos", color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/10" },
              { icon: Pill, label: "Administrar Medicamento", shortLabel: "Medicamentos", color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/10" },
              { icon: Heart, label: "Verificar Sinais Vitais", shortLabel: "Sinais Vitais", color: "from-red-500 to-rose-500", bgColor: "bg-red-500/10" },
              { icon: Activity, label: "Débito de Dreno", shortLabel: "Dreno", color: "from-emerald-500 to-teal-500", bgColor: "bg-emerald-500/10" }
            ].map((action, index) => (
              <Button 
                key={index}
                variant="outline" 
                className={`w-full justify-start text-left group/action hover:scale-[1.02] transition-all duration-300 border-border/50 hover:border-transparent hover:shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ${isMobile ? 'h-auto p-3' : 'h-auto p-4'}`}
                onClick={() => navigate('/care')}
                style={{
                  animationDelay: `${(index + 7) * 100}ms`,
                  animation: isVisible ? 'slideInRight 0.6s ease-out forwards' : 'none'
                }}
              >
                <div className={`flex items-center w-full ${isMobile ? 'gap-3' : 'gap-4'}`}>
                  <div className={`rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover/action:scale-110 group-hover/action:rotate-6 transition-all duration-300 ${isMobile ? 'p-2' : 'p-3'}`}>
                    <action.icon className={`text-white ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium text-foreground group-hover/action:text-blue-600 dark:group-hover/action:text-blue-400 transition-colors duration-300 ${isMobile ? 'text-sm' : ''}`}>
                      {isMobile ? action.shortLabel : action.label}
                    </span>
                  </div>
                  {!isMobile && (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover/action:text-blue-500 group-hover/action:translate-x-1 group-hover/action:-translate-y-1 transition-all duration-300" />
                  )}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Import/Export Modal */}
      <ImportExportModal 
        open={showImportExport}
        onOpenChange={setShowImportExport}
      />
    </div>
  )
}

export default Dashboard