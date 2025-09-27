import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CareForm } from "@/components/CareForm"
import { ImportExportModal } from "@/components/ImportExportModal"
import { usePatients } from "@/hooks/usePatients"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useToast } from "@/hooks/use-toast"
import { 
  Heart, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Droplets,
  Pill,
  Activity,
  Utensils,
  Toilet,
  Database,
  Trash2,
  Sparkles,
  ArrowUpRight,
  Smile
} from "lucide-react"

export default function Care() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showImportExport, setShowImportExport] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  
  const { patients } = usePatients()
  const { events, loading, addEvent, deleteEvent, refetch } = useCareEvents(selectedPatientId)
  const { toast } = useToast()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      toast({
        title: "Registro excluído",
        description: "O registro de cuidado foi excluído com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o registro. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drink': return Droplets
      case 'med': return Pill
      case 'note': return Activity
      case 'meal': return Utensils
      case 'bathroom': return Toilet
      case 'humor': return Smile
      default: return Heart
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'drink': return 'text-primary'
      case 'med': return 'text-accent'
      case 'note': return 'text-secondary'
      case 'meal': return 'text-warning'
      case 'bathroom': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'medication': return 'Medicação'
      case 'vital_signs': return 'Sinais Vitais'
      case 'drain': return 'Dreno'
      case 'drink': return 'Líquidos'
      case 'mood': return 'Humor'
      case 'humor': return 'Humor'
      case 'med': return 'Medicamento'
      case 'meal': return 'Alimentação'
      case 'bathroom': return 'Banheiro'
      case 'note': return 'Anotação'
      default: return type
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.bed.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEvents = events.filter(event => {
    if (categoryFilter === "all") return true
    return event.type === categoryFilter
  })

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header with Enhanced Glassmorphism */}
        <div className={`relative transition-all duration-800 ${isVisible ? 'animate-slide-in-up' : 'opacity-0 translate-y-8'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 hover:shadow-3xl transition-all duration-500">
            <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                    <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                      Cuidados
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg font-medium">
                      Registro e acompanhamento de cuidados dos pacientes
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-2 sm:px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    {events.length} registros hoje
                  </span>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Sistema ativo
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full lg:w-auto">
                <div className="flex flex-col xs:flex-row gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowImportExport(true)}
                    className="group h-10 sm:h-12 px-3 sm:px-6 rounded-xl border-2 border-blue-200 bg-white/90 backdrop-blur-sm hover:border-blue-300 hover:bg-blue-50/80 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-xs sm:text-sm flex-1 xs:flex-none"
                  >
                    <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline">Import/Export</span>
                    <span className="sm:hidden">Dados</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="group h-10 sm:h-12 px-3 sm:px-6 rounded-xl border-2 border-indigo-200 bg-white/90 backdrop-blur-sm hover:border-indigo-300 hover:bg-indigo-50/80 hover:text-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-xs sm:text-sm flex-1 xs:flex-none"
                  >
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline">Relatório Diário</span>
                    <span className="sm:hidden">Relatório</span>
                  </Button>
                </div>
                <Button 
                  variant="default"
                  className="group h-10 sm:h-12 px-3 sm:px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0 text-xs sm:text-sm w-full lg:w-auto"
                >
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="hidden sm:inline">Novo Registro</span>
                  <span className="sm:hidden">Novo</span>
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Patient Selection with Enhanced Design */}
        <div className={`xl:col-span-1 transition-all duration-700 ${isVisible ? 'animate-slide-in-left' : 'opacity-0 -translate-x-8'}`}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <Card className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent font-bold">
                    Selecionar Paciente
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                  Escolha o paciente para registrar cuidados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="relative group">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 group-focus-within:text-blue-500 transition-colors duration-300" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 sm:pl-12 h-10 sm:h-12 rounded-xl border-2 border-gray-200 bg-white/90 backdrop-blur-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 font-medium text-sm sm:text-base"
                  />
                </div>
                
                <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto custom-scrollbar">
                  {filteredPatients.map((patient, index) => (
                    <div
                      key={patient.id}
                      className={`group relative p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                        selectedPatientId === patient.id
                          ? "border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      }`}
                      onClick={() => setSelectedPatientId(patient.id)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0 group-hover:border-blue-400 transition-all duration-300">
                            {patient.photo ? (
                              <img
                                src={patient.photo}
                                alt={`Foto de ${patient.full_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-800 dark:to-indigo-900 flex items-center justify-center">
                                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                            {selectedPatientId === patient.id && (
                              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse"></div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300 text-sm sm:text-base truncate">
                              {patient.full_name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                              Leito {patient.bed}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge 
                            variant={patient.notes?.includes('crítico') ? 'destructive' : 'secondary'}
                            className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium"
                          >
                            {patient.notes?.includes('crítico') ? 'Crítico' : 'Estável'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Care Form with Enhanced Design */}
        <div className={`xl:col-span-2 transition-all duration-700 ${isVisible ? 'animate-slide-in-right' : 'opacity-0 translate-x-8'}`}>
          {selectedPatientId ? (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <CareForm 
                  patientId={selectedPatientId}
                  onSave={async (data) => {
                  try {
                    // Map the form data to the correct event type enum
                    let eventType: 'sleep' | 'feeding' | 'diaper' | 'mood' | 'bathroom';
                    switch (data.type) {
                      case 'liquid':
                      case 'food':
                        eventType = 'feeding';
                        break;
                      case 'bathroom':
                        eventType = 'bathroom';
                        break;
                      case 'humor':
                        eventType = 'mood';
                        break;
                      case 'medication':
                      case 'drain':
                      case 'vitals':
                        eventType = 'sleep'; // Default fallback
                        break;
                      default:
                        eventType = 'sleep';
                    }

                    await addEvent({
                      patient_id: data.patient_id,
                      date: data.date,
                      type: eventType,
                      notes: data.notes,
                      volume_ml: data.volume_ml,
                      bathroom_type: data.bathroom_type,
                      mood_scale: data.mood_scale
                    });
                    await refetch();
                  } catch (error) {
                    console.error('Error saving event:', error);
                  }
                }}
                />
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <Card className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardContent className="py-16 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl opacity-50"></div>
                    <Heart className="relative h-16 w-16 text-blue-500 mx-auto mb-6 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-3">
                    Selecione um Paciente
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg font-medium max-w-md mx-auto">
                    Escolha um paciente da lista ao lado para começar a registrar cuidados.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Sparkles className="h-4 w-4" />
                    <span>Sistema pronto para uso</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Recent Care Records with Enhanced Design */}
      <div className={`transition-all duration-800 ${isVisible ? 'animate-slide-in-up' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '400ms' }}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          <Card className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl shadow-lg">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent font-bold">
                      Registros Recentes
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                    Últimos cuidados registrados no sistema
                  </CardDescription>
                </div>
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm w-full sm:w-auto"
                >
                  <option value="all">Todas as categorias</option>
                  <option value="medication">Medicação</option>
                  <option value="vital_signs">Sinais Vitais</option>
                  <option value="drain">Dreno</option>
                  <option value="drink">Líquidos</option>
                  <option value="mood">Humor</option>
                  <option value="humor">Humor</option>
                  <option value="med">Medicamentos</option>
                  <option value="meal">Alimentação</option>
                  <option value="bathroom">Banheiro</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {filteredEvents.slice(0, 10).map((event) => {
                  const patient = patients.find(p => p.id === event.patient_id)
                  const Icon = getTypeIcon(event.type)
                  
                  // Função para formatar todos os dados do evento
                  const formatEventData = (event: any) => {
                    const data = []
                    
                    // Dados específicos por tipo
                    if (event.type === 'drink' && event.volume_ml) {
                      data.push(`Volume: ${event.volume_ml}ml`)
                    }
                    if (event.type === 'medication' && event.med_name) {
                      data.push(`Medicamento: ${event.med_name}`)
                      if (event.med_dose) data.push(`Dose: ${event.med_dose}`)
                    }
                    if (event.type === 'meal' && event.meal_desc) {
                      data.push(`Refeição: ${event.meal_desc}`)
                    }
                    if (event.type === 'bathroom' && event.bathroom_type) {
                      data.push(`Tipo: ${event.bathroom_type}`)
                    }
                    if (event.type === 'mood' && event.mood_scale) {
                      data.push(`Escala de Humor: ${event.mood_scale}/5`)
                    }
                    
                    // Dados gerais
                    if (event.volume_ml && event.type !== 'drink') {
                      data.push(`Volume: ${event.volume_ml}ml`)
                    }
                    if (event.mood_scale && event.type !== 'mood') {
                      data.push(`Humor: ${event.mood_scale}/5`)
                    }
                    if (event.bathroom_type && event.type !== 'bathroom') {
                      data.push(`Banheiro: ${event.bathroom_type}`)
                    }
                    if (event.notes) {
                      data.push(`Observações: ${event.notes}`)
                    }
                    
                    return data
                  }
                  
                  const eventData = formatEventData(event)
                  
                  return (
                    <div key={event.id} className="border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Cabeçalho do evento */}
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                        <div className={`p-1.5 sm:p-2 rounded-lg bg-muted ${getTypeColor(event.type)} flex-shrink-0`}>
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-foreground text-sm sm:text-base">{getTypeName(event.type)}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-xs sm:text-sm font-medium text-foreground">
                                  {new Date(event.created_at).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.created_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 sm:p-2"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            Paciente: {patient?.full_name || 'Paciente removido'} - Leito {patient?.bed || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Dados detalhados do evento */}
                      {eventData.length > 0 && (
                        <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-border/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            {eventData.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary/60 rounded-full flex-shrink-0"></div>
                                <span className="text-xs sm:text-sm text-foreground font-medium">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import/Export Modal */}
      <ImportExportModal 
        open={showImportExport}
        onOpenChange={setShowImportExport}
        defaultPatientId={selectedPatientId || undefined}
      />
      </div>
    </div>
  )
}